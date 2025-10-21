module orbitrium::main;

use commitment::action::create_action;
use commitment::state::commit_action;
use coordination::app_instance::{AppInstance, AppInstanceCap};
use coordination::registry::{
    SilvanaRegistry,
    create_app_instance_from_registry
};
use orbitrium::game::{Self, Game, UpdateEvent, create_game};
use std::string::String;
use sui::bcs;
use sui::bls12381::Scalar;
use sui::clock::Clock;
use sui::event;
use sui::group_ops::Element;

public struct App has key, store {
    id: UID,
    instance_cap: AppInstanceCap,
    game: Game,
}

// Events
public struct AppCreatedEvent has copy, drop {
    app_address: address,
    initial_actions_commitment: Element<Scalar>,
    initial_actions_sequence: u64,
    initial_state_commitment: Element<Scalar>,
    created_at: u64,
}

public struct ClickEvent has copy, drop {
    app_address: address,
    event: UpdateEvent,
}

// Struct for serializing transition data
public struct TransitionData has copy, drop {
    block_number: u64,
    sequence: u64,
    method: String,
    event: UpdateEvent,
}

public fun create_app(
    registry: &mut SilvanaRegistry,
    settlement_chains: vector<String>,
    settlement_addresses: vector<Option<String>>,
    block_creation_interval_ms: u64,
    user_address: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
): App {
    // Create an app instance from the registry's SilvanaApp
    // This creates and shares an AppInstance
    let instance_cap = create_app_instance_from_registry(
        registry,
        b"orbitrium".to_string(),
        option::none(), // description
        settlement_chains,
        settlement_addresses,
        block_creation_interval_ms,
        clock,
        ctx,
    );

    let app_id = object::new(ctx);
    let app_address = app_id.to_address();
    let game = create_game(user_address, clock, ctx);

    let app = App {
        id: app_id,
        instance_cap,
        game,
    };

    event::emit(AppCreatedEvent {
        app_address,
        created_at: clock.timestamp_ms(),
        initial_actions_commitment: sui::bls12381::scalar_zero(),
        initial_actions_sequence: 1u64,
        initial_state_commitment: sui::bls12381::scalar_zero(),
    });

    app
}

public fun init_app_with_instance(
    app: &App,
    instance: &mut AppInstance,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Initialize with sum equal to 0 as there are no elements yet
    let action = create_action(b"init".to_string(), vector[]);
    instance.state_mut(&app.instance_cap).commit_action(action, &vector[], ctx);

    coordination::app_instance::create_app_job(
        instance,
        b"init".to_string(),
        option::some(b"Deploy SmartContract".to_string()),
        option::none(), // block_number from instance
        option::none(), // sequence
        option::none(), // sequences1
        option::none(), // sequences2
        vector[],
        option::none(), // interval_ms - not periodic
        option::none(), // next_scheduled_at - not periodic
        option::none(), // settlement_chain - not settlement job
        clock,
        ctx,
    );

    // Add sequence 0 state to the sequence state manager
    // No transition data for initial state, so use empty vector
    coordination::app_instance::increase_sequence(
        instance,
        vector[],
        vector[],
        clock,
        ctx,
    );
}

public fun click(
    app: &mut App,
    instance: &mut AppInstance,
    rule_id: u64,
    targetMagnitude: vector<u64>,
    priceMagnitude: vector<u64>,
    signature: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let event = game::click(
        &mut app.game,
        rule_id,
        targetMagnitude,
        priceMagnitude,
        signature,
        clock,
    );
    let block_number = instance.block_number();
    let sequence = instance.sequence();
    let transition_data = TransitionData {
        block_number,
        sequence,
        method: b"click".to_string(),
        event,
    };
    let transition_data_bytes = bcs::to_bytes(&transition_data);

    coordination::app_instance::create_app_job(
        instance,
        b"click".to_string(),
        option::some(b"Click operation job".to_string()),
        option::some(block_number), // block_number from instance
        option::some(vector[sequence]),
        option::none(), // sequences1
        option::none(), // sequences2
        transition_data_bytes,
        option::none(), // interval_ms - not periodic
        option::none(), // next_scheduled_at - not periodic
        option::none(), // settlement_chain - not settlement job
        clock,
        ctx,
    );

    // Emit event for prover
    event::emit(ClickEvent {
        app_address: app.id.to_address(),
        event,
    });

    coordination::app_instance::increase_sequence(
        instance,
        vector[],
        transition_data_bytes,
        clock,
        ctx,
    );
}
