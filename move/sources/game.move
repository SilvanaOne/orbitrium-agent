// ────────────────────────────────────────────────────────────────
module addr::game;

use addr::resource_vector::{Self as RV, ResourceVector};
use std::vector;
use sui::clock::{Self, Clock};
use sui::object::{Self, UID, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use std::u64::{Self};

use std::bcs;
use sui::{ed25519};
use sui::event;
use std::u64::pow;

// ────────────────────────────────────────────────────────────────
//  ERROR CODES
// ────────────────────────────────────────────────────────────────

/// Error code: Invalid target magnitude vector length
const E_INVALID_TARGET_MAGNITUDE_LENGTH: u64 = 1001;

/// Error code: Insufficient resources for upgrade
const E_INSUFFICIENT_RESOURCES: u64 = 1002;

/// Error code: Invalid signature verification
const E_INVALID_SIGNATURE: u64 = 1003;

/// Error code: Invalid upgrade type
const E_INVALID_UPGRADE_TYPE: u64 = 1004;

/// Error code: Already seen
const E_ALREADY_SEEN: u64 = 1005;

/// Error code: Invalid time
const E_INVALID_TIME: u64 = 1006;

/// Error code: Invalid amount
const E_INVALID_AMOUNT: u64 = 1007;

const DECIMALS: u8 = 6;

const ADMIN_PUBLIC_KEY: vector<u8> = vector[
  222, 199, 192, 244, 234, 197,  40, 175,
  227, 169,  63, 164,  31,  64,  20, 192,
   46,  21, 104, 138, 185,  44, 116, 249,
   22,  58, 177, 143, 225, 161,   6, 192
];

/// Separate object to store upgrade usage as packed bits
/// This allows the Game object to only store a reference,
/// reducing gas costs when loading the Game
public struct UpgradeRegistry has key, store {
    id: UID,
    upgrade_used: vector<u64>, // Packed bit vector for gas efficiency
}

public struct Game has key {
    id: UID,
    user_address: vector<u8>, // Zeko address of the user
    resources: ResourceVector,
    storages: ResourceVector,
    rps: ResourceVector,
    click_pow: ResourceVector,
    last_claim_time: ResourceVector,
    click_upgrade_levels: ResourceVector,
    idle_upgrade_levels: ResourceVector,
    storage_upgrade_levels: ResourceVector,
    upgrade_registry_id: ID, // Reference to UpgradeRegistry object
}

public struct ClickPayload has copy, drop, store {
    rule_id: u64,
    targetMagnitude: vector<u64>,
    priceMagnitude:  vector<u64>,
}

// Add target, type and level
public struct UpgradePayload has copy, drop, store {
    rule_id: u64,
    priceMagnitude: vector<u64>,
    rpsPriceMagnitude: vector<u64>,
    targetMagnitude: vector<u64>,
    rpsMagnitude: vector<u64>,
    storagesMagnitude: vector<u64>,
    clickPowMagnitude: vector<u64>,
}


public struct ClickEvent has copy, drop {
    game_id: ID,
    rule_id: u64,
    time_passed: vector<u64>,
}

public struct UpgradeEvent has copy, drop {
    game_id: ID,
    rule_id: u64,
}


// Create empty new game for user
public entry fun create_game(clock: &Clock, user_address: vector<u8>, ctx: &mut TxContext) {
    // Create the upgrade registry as a separate object
    let upgrade_registry = UpgradeRegistry {
        id: object::new(ctx),
        upgrade_used: init_packed_bools(7000),
    };
    let upgrade_registry_id = object::id(&upgrade_registry);
    
    let game = Game {
        id: object::new(ctx),
        user_address,
        resources: RV::zero(),
        storages: RV::newAll(100 * (pow(10u64, DECIMALS))),
        rps: RV::zero(),
        // click_pow: RV::new_single(1, 0),
        click_pow: RV::new_single(1 * (pow(10u64, DECIMALS)), 0), // TODO: for testing only
        last_claim_time: RV::newAll(clock::timestamp_ms(clock)),
        click_upgrade_levels: RV::newAll(0),
        idle_upgrade_levels: RV::newAll(0),
        storage_upgrade_levels: RV::newAll(0),
        upgrade_registry_id,
    };

    let sender = tx_context::sender(ctx);
    transfer::transfer(upgrade_registry, sender);
    transfer::transfer(game, sender);
}

/**
 * Click on the game to generate resources
 * 
 * @param game - The game to click on
 * @param targetMagnitude - The magnitude of the target to click on, single non zero element
 * @param priceMagnitude - The magnitude of the price
 * @param amount - The number of clicks to perform
 * @param signature - The signature of the rule(targetMagnitude + priceMagnitude + amount)
 * @param clock - The clock
 * @param ctx - The transaction context
 */
public entry fun click(
    game: &mut Game,
    rule_id: u64,
    targetMagnitude: vector<u64>,
    priceMagnitude: vector<u64>,
    amount: u64,
    signature: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // #TODO add rule check
    let payload = ClickPayload {
        rule_id,
        targetMagnitude,
        priceMagnitude,
    };

    let msg_bytes = bcs::to_bytes<ClickPayload>(&payload);
    let is_valid = sui::ed25519::ed25519_verify(&signature, &ADMIN_PUBLIC_KEY, &msg_bytes);
    assert!(is_valid, E_INVALID_SIGNATURE);

    assert!(amount <= 200, E_INVALID_AMOUNT);
    
    // Check magnitude
    assert!(vector::length(&targetMagnitude) == 21u64, E_INVALID_TARGET_MAGNITUDE_LENGTH);

    
    let target = RV::new(targetMagnitude);
    let click_power_targeted = RV::div(&RV::vector_mul(&game.click_pow, &target), pow(10u64, DECIMALS));
    let click_power_with_amount = RV::mul(&click_power_targeted, amount);

    let price = RV::div(
        &RV::vector_mul(&RV::new(priceMagnitude), &click_power_with_amount), 
        pow(10u64, DECIMALS)
    );

    let now = clock::timestamp_ms(clock);
    let now_vec = RV::newAll(now);

    assert!(RV::ge(&now_vec, &game.last_claim_time), E_INVALID_TIME);
    let elapsed = RV::sub(&now_vec, &game.last_claim_time);
    let elapsed_targeted = RV::div(&RV::vector_mul(&elapsed, &target), pow(10u64, DECIMALS));
    let elapsed_secs_targeted = RV::div(&elapsed_targeted, 1000);

    // Δresources = rps * Δt + click_power * amount
    let generated = RV::vector_mul(&game.rps, &elapsed_secs_targeted);
    let limited = RV::limit(&generated, &game.storages);
    let increment = RV::add(&limited, &click_power_with_amount);

    let total_with_income = RV::add(&game.resources, &increment);

    assert!(RV::ge(&total_with_income, &price), E_INSUFFICIENT_RESOURCES);
    let new_total = RV::sub(&total_with_income, &price);

    // Commit state
    game.resources = new_total; 
    game.last_claim_time = RV::add(&game.last_claim_time, &elapsed_targeted);

    event::emit(ClickEvent {
        game_id: object::id(game),
        rule_id,
        time_passed: elapsed_targeted.value(),
    });
}

/**
 * Upgrade the game to increase the resource generation rate, storage capacity, click power, etc.
 * 
 * @param game - The game to upgrade
 * @param upgrade_registry - The upgrade registry to check and update upgrade usage
 * @param priceMagnitude - The magnitude of the price
 * @param rpsPriceMagnitude - The magnitude of the rps price
 * @param rpsMagnitude - The magnitude of the cps
 * @param storagesMagnitude - The magnitude of the storages
 * @param clickPowMagnitude - The magnitude of the click power
 * @param signature - The signature of the rule(priceMagnitude + rpsPriceMagnitude + cpsMagnitude + storagesMagnitude + clickPowMagnitude)
 * @param clock - The clock
 * @param ctx - The transaction context
*/
public entry fun upgrade(
    game: &mut Game,
    upgrade_registry: &mut UpgradeRegistry,
    rule_id: u64,
    priceMagnitude: vector<u64>,
    rpsPriceMagnitude: vector<u64>,
    targetMagnitude: vector<u64>,
    rpsMagnitude: vector<u64>,
    storagesMagnitude: vector<u64>,
    clickPowMagnitude: vector<u64>,
    clickUpgradeLevelInc: vector<u64>,
    idleUpgradeLevelInc: vector<u64>,
    storageUpgradeLevelInc: vector<u64>,
    signature: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // #TODO add rule check
    let payload = UpgradePayload {
        rule_id,
        priceMagnitude,
        rpsPriceMagnitude,
        targetMagnitude,
        rpsMagnitude,
        storagesMagnitude,
        clickPowMagnitude,
    };

    let msg_bytes = bcs::to_bytes<UpgradePayload>(&payload);
    let is_valid = sui::ed25519::ed25519_verify(&signature, &ADMIN_PUBLIC_KEY, &msg_bytes);
    assert!(is_valid, E_INVALID_SIGNATURE);
    
    assert!(!is_bit_set(&upgrade_registry.upgrade_used, rule_id), E_ALREADY_SEEN);
    set_bit(&mut upgrade_registry.upgrade_used, rule_id);

    let price = RV::new(priceMagnitude);
    let rpsPrice = RV::new(rpsPriceMagnitude);
    let target = RV::new(targetMagnitude);
    let rps = RV::new(rpsMagnitude);
    let storages = RV::new(storagesMagnitude);
    let clickPow = RV::new(clickPowMagnitude);
    
    game.resources = RV::add(&game.resources, &target);
    game.resources = RV::sub(&game.resources, &price);
    game.rps = RV::add(&game.rps, &rps);
    game.rps = RV::sub(&game.rps, &rpsPrice);
    game.storages = RV::add(&game.storages, &storages);
    game.click_pow = RV::add(&game.click_pow, &clickPow);
    game.click_upgrade_levels = RV::add(&game.click_upgrade_levels, &RV::new(clickUpgradeLevelInc));
    game.idle_upgrade_levels = RV::add(&game.idle_upgrade_levels, &RV::new(idleUpgradeLevelInc));
    game.storage_upgrade_levels = RV::add(&game.storage_upgrade_levels, &RV::new(storageUpgradeLevelInc));

    // Emit upgrade event
    event::emit(UpgradeEvent {
        game_id: object::id(game),
        rule_id,
    });
}


/// Initialize a packed boolean vector with the given capacity
/// Each u64 stores 64 boolean values as bits (all initialized to false/0)
public fun init_packed_bools(capacity: u64): vector<u64> {
    let num_words = (capacity + 63) / 64; // ceil(capacity / 64)
    let mut v = vector::empty<u64>();
    let mut i = 0;
    while (i < num_words) {
        vector::push_back(&mut v, 0);
        i = i + 1;
    };
    v
}

/// Check if a bit is set at the given index in the packed boolean vector
public fun is_bit_set(packed_vec: &vector<u64>, index: u64): bool {
    let word_index = index / 64;
    let bit_index = index % 64;
    let word = *vector::borrow(packed_vec, word_index);
    let mask = 1u64 << (bit_index as u8);
    (word & mask) != 0
}

/// Set a bit to true at the given index in the packed boolean vector
public fun set_bit(packed_vec: &mut vector<u64>, index: u64) {
    let word_index = index / 64;
    let bit_index = index % 64;
    let word_ref = vector::borrow_mut(packed_vec, word_index);
    let mask = 1u64 << (bit_index as u8);
    *word_ref = *word_ref | mask;
}

// ────────────────────────────────────────────────────────────────
//  PUBLIC ACCESSORS (for testing and external queries)
// ────────────────────────────────────────────────────────────────

/// Get the current resources of the game
public fun get_resources(game: &Game): ResourceVector {
    game.resources
}

/// Get the current storage capacity of the game
public fun get_storages(game: &Game): ResourceVector {
    game.storages
}

/// Get the current resource generation rate (resources per second)
public fun get_rps(game: &Game): ResourceVector {
    game.rps
}

/// Get the current click power of the game
public fun get_click_pow(game: &Game): ResourceVector {
    game.click_pow
}

/// Get the last claim time for each resource
public fun get_last_claim_time(game: &Game): ResourceVector {
    game.last_claim_time
}

/// Get the upgrade registry ID reference
public fun get_upgrade_registry_id(game: &Game): ID {
    game.upgrade_registry_id
}

/// Check if an upgrade has been used in the registry
public fun is_upgrade_used(registry: &UpgradeRegistry, rule_id: u64): bool {
    is_bit_set(&registry.upgrade_used, rule_id)
}

// ────────────────────────────────────────────────────────────────
//  PUBLIC SETTERS (for testing and admin operations)
// ────────────────────────────────────────────────────────────────

/// Set the resource generation rate (resources per second)
public fun set_rps(game: &mut Game, new_rps: ResourceVector) {
    game.rps = new_rps;
}

/// Set the storage capacity
public fun set_storages(game: &mut Game, new_storages: ResourceVector) {
    game.storages = new_storages;
}

/// Set the click power
public fun set_click_pow(game: &mut Game, new_click_pow: ResourceVector) {
    game.click_pow = new_click_pow;
}

/// Set the resources directly
public fun set_resources(game: &mut Game, new_resources: ResourceVector) {
    game.resources = new_resources;
}

/// Set the last claim time
public fun set_last_claim_time(game: &mut Game, new_last_claim_time: ResourceVector) {
    game.last_claim_time = new_last_claim_time;
}
