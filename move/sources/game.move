// ────────────────────────────────────────────────────────────────
module orbitrium::game;

use orbitrium::resource_vector::{Self as RV, ResourceVector};
use std::bcs;
use std::u64::pow;
use sui::clock::{Self, Clock};
use sui::event;

// ────────────────────────────────────────────────────────────────
//  ERROR CODES
// ────────────────────────────────────────────────────────────────

/// Error code: Invalid target magnitude vector length
const E_INVALID_TARGET_MAGNITUDE_LENGTH: u64 = 1001;

/// Error code: Insufficient resources for upgrade
const E_INSUFFICIENT_RESOURCES: u64 = 1002;

/// Error code: Invalid signature verification
const E_INVALID_SIGNATURE: u64 = 1003;

/// Error code: Already seen
const E_ALREADY_SEEN: u64 = 1005;

/// Error code: Invalid time
const E_INVALID_TIME: u64 = 1006;

const DECIMALS: u8 = 6;

const ADMIN_PUBLIC_KEY: vector<u8> = vector[
    222, 199, 192, 244, 234, 197, 40, 175, 227, 169, 63, 164, 31, 64, 20, 192,
    46, 21, 104, 138, 185, 44, 116, 249, 22, 58, 177, 143, 225, 161, 6, 192,
];

public struct Game has key, store {
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
    upgrade_used: sui::table::Table<vector<u8>, bool>,
}

public struct ClickPayload has copy, drop, store {
    rule_id: u64,
    targetMagnitude: vector<u64>,
    priceMagnitude: vector<u64>,
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

// Event struct for upgrade and click
public struct UpdateEvent has copy, drop {
    game_id: ID,
    rule_id: u64,
    time_passed: vector<u64>,
    resources: vector<u64>,
    click_pow: vector<u64>,
    rps: vector<u64>,
    storages: vector<u64>,
}

// Create empty new game for user
public fun create_game(
    user_address: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
): Game {
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
        upgrade_used: sui::table::new(ctx),
    };

    game
}

/**
 * Click on the game to generate resources
 * 
 * @param game - The game to click on
 * @param targetMagnitude - The magnitude of the target to click on, single non zero element
 * @param priceMagnitude - The magnitude of the price
 * @param signature - The signature of the rule(targetMagnitude + priceMagnitude)
 * @param clock - The clock
 * @param ctx - The transaction context
 */
#[allow(implicit_const_copy)]
public fun click(
    game: &mut Game,
    rule_id: u64,
    targetMagnitude: vector<u64>,
    priceMagnitude: vector<u64>,
    signature: vector<u8>,
    clock: &Clock,
): UpdateEvent {
    // #TODO add rule check
    let payload = ClickPayload {
        rule_id,
        targetMagnitude,
        priceMagnitude,
    };

    let msg_bytes = bcs::to_bytes<ClickPayload>(&payload);
    let is_valid = sui::ed25519::ed25519_verify(
        &signature,
        &ADMIN_PUBLIC_KEY,
        &msg_bytes,
    );
    assert!(is_valid, E_INVALID_SIGNATURE);

    // #TODO Add target magnitude check (single 1)

    // Check magnitude
    assert!(
        vector::length(&targetMagnitude) == 21u64,
        E_INVALID_TARGET_MAGNITUDE_LENGTH,
    );

    let target = RV::new(targetMagnitude);
    let click_power_targeted = RV::div(
        &RV::vector_mul(&game.click_pow, &target),
        pow(10u64, DECIMALS),
    );

    let price = RV::div(
        &RV::vector_mul(&RV::new(priceMagnitude), &click_power_targeted),
        pow(10u64, DECIMALS),
    );

    let now = clock::timestamp_ms(clock);
    let now_vec = RV::newAll(now);

    assert!(RV::ge(&now_vec, &game.last_claim_time), E_INVALID_TIME);
    let elapsed = RV::sub(&now_vec, &game.last_claim_time);
    let elapsed_targeted = RV::div(
        &RV::vector_mul(&elapsed, &target),
        pow(10u64, DECIMALS),
    );
    let elapsed_secs_targeted = RV::div(&elapsed_targeted, 1000);

    // Δresources = rps * Δt + click_power
    let generated = RV::vector_mul(&game.rps, &elapsed_secs_targeted);
    let limited = RV::limit(&generated, &game.storages);
    let increment = RV::add(&limited, &click_power_targeted);

    let total_with_income = RV::add(&game.resources, &increment);

    assert!(RV::ge(&total_with_income, &price), E_INSUFFICIENT_RESOURCES);
    let new_total = RV::sub(&total_with_income, &price);

    // Commit state
    game.resources = new_total;
    game.last_claim_time = RV::add(&game.last_claim_time, &elapsed_targeted);

    let event = UpdateEvent {
        game_id: object::id(game),
        rule_id,
        time_passed: elapsed_targeted.value(),
        resources: new_total.value(),
        click_pow: click_power_targeted.value(),
        rps: generated.value(),
        storages: limited.value(),
    };
    event::emit(event);
    event
}

/**
 * Upgrade the game to increase the resource generation rate, storage capacity, click power, etc.
 * 
 * @param game - The game to upgrade
 * @param priceMagnitude - The magnitude of the price
 * @param rpsPriceMagnitude - The magnitude of the rps price
 * @param rpsMagnitude - The magnitude of the cps
 * @param storagesMagnitude - The magnitude of the storages
 * @param clickPowMagnitude - The magnitude of the click power
 * @param signature - The signature of the rule(priceMagnitude + rpsPriceMagnitude + cpsMagnitude + storagesMagnitude + clickPowMagnitude)
 * @param clock - The clock
 * @param ctx - The transaction context
*/
#[allow(implicit_const_copy)]
public fun upgrade(
    game: &mut Game,
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
    let is_valid = sui::ed25519::ed25519_verify(
        &signature,
        &ADMIN_PUBLIC_KEY,
        &msg_bytes,
    );
    assert!(is_valid, E_INVALID_SIGNATURE);

    assert!(
        !sui::table::contains(&game.upgrade_used, msg_bytes),
        E_ALREADY_SEEN,
    );
    sui::table::add(&mut game.upgrade_used, msg_bytes, true);

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
    game.click_upgrade_levels =
        RV::add(&game.click_upgrade_levels, &RV::new(clickUpgradeLevelInc));
    game.idle_upgrade_levels =
        RV::add(&game.idle_upgrade_levels, &RV::new(idleUpgradeLevelInc));
    game.storage_upgrade_levels =
        RV::add(&game.storage_upgrade_levels, &RV::new(storageUpgradeLevelInc));

    // Emit upgrade event
    event::emit(UpdateEvent {
        game_id: object::id(game),
        rule_id,
        time_passed: vector::empty(),
        resources: game.resources.value(),
        click_pow: game.click_pow.value(),
        rps: game.rps.value(),
        storages: game.storages.value(),
    });
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
public fun set_last_claim_time(
    game: &mut Game,
    new_last_claim_time: ResourceVector,
) {
    game.last_claim_time = new_last_claim_time;
}
