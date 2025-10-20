// ────────────────────────────────────────────────────────────────
// File: sources/resource_vector.move
// A fixed-width "vector" of resources.
// ────────────────────────────────────────────────────────────────

module orbitrium::resource_vector;

const LENGTH: u64 = 21;
const E_OVERFLOW: u64 = 1;
const E_INVALID_LENGTH: u64 = 2;

public struct ResourceVector has copy, drop, store {
    resources: vector<u64>,
}

public fun set(a: &mut ResourceVector, index: u64, value: u64) {
    *vector::borrow_mut(&mut a.resources, index) = value;
}

public fun get(a: &ResourceVector, index: u64): u64 {
    *vector::borrow(&a.resources, index)
}

public fun value(a: &ResourceVector): vector<u64> {
    a.resources
}

/// Creates a zero-filled vector.
public fun zero(): ResourceVector {
    let result = vector[
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    ];
    assert!(vector::length(&result) == LENGTH, E_INVALID_LENGTH);
    ResourceVector { resources: result }
}

/// Adds two vectors (component-wise).
public fun add(a: &ResourceVector, b: &ResourceVector): ResourceVector {
    let mut result = vector::empty();
    let len = vector::length(&a.resources);
    let mut i = 0;
    while (i < len) {
        vector::push_back(&mut result, a.resources[i] + b.resources[i]);
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// Subtracts two vectors (component-wise).
public fun sub(a: &ResourceVector, b: &ResourceVector): ResourceVector {
    let mut result = vector::empty();
    let len = vector::length(&a.resources);
    let mut i = 0;
    while (i < len) {
        vector::push_back(&mut result, a.resources[i] - b.resources[i]);
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// Adds two vectors with signs applied to the second vector.
public fun add_signed(
    a: &ResourceVector,
    b: &ResourceVector,
    signs: vector<u64>,
): ResourceVector {
    let mut result = vector::empty();
    let len = vector::length(&a.resources);
    let mut i = 0;
    while (i < len) {
        vector::push_back(
            &mut result,
            a.resources[i] + b.resources[i] * signs[i],
        );
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// Multiplies every component by the same scalar.
public fun mul(a: &ResourceVector, k: u64): ResourceVector {
    let mut result = vector::empty();
    let len = vector::length(&a.resources);
    let mut i = 0;
    while (i < len) {
        vector::push_back(&mut result, a.resources[i] * k);
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// Divides every component by the same scalar.
public fun div(a: &ResourceVector, k: u64): ResourceVector {
    let mut result = vector::empty();
    let len = vector::length(&a.resources);
    let mut i = 0;
    while (i < len) {
        vector::push_back(&mut result, a.resources[i] / k);
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// Multiplies two vectors component-wise.
public fun vector_mul(a: &ResourceVector, b: &ResourceVector): ResourceVector {
    let mut result = vector::empty();
    let len = vector::length(&a.resources);
    let mut i = 0;
    while (i < len) {
        vector::push_back(&mut result, a.resources[i] * b.resources[i]);
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// A thin wrapper so callers can import just one symbol.
public fun new(resources: vector<u64>): ResourceVector {
    assert!(vector::length(&resources) == LENGTH, E_OVERFLOW);
    ResourceVector { resources: resources }
}

/// Creates a vector with a single non-zero value at the specified index.
public fun new_single(value: u64, index: u64): ResourceVector {
    let mut result = vector::empty();
    let mut i = 0;
    while (i < LENGTH) {
        vector::push_back(&mut result, if (i == index) { value } else { 0 });
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// Creates a vector with all components set to the same value.
public fun newAll(all: u64): ResourceVector {
    let mut result = vector::empty();
    let mut i = 0;
    while (i < LENGTH) {
        vector::push_back(&mut result, all);
        i = i + 1;
    };
    ResourceVector { resources: result }
}

/// Returns the component-wise minimum of target and limit vectors.
public fun limit(
    target: &ResourceVector,
    limit: &ResourceVector,
): ResourceVector {
    let mut result = vector::empty();
    let len = vector::length(&target.resources);
    let mut i = 0;
    while (i < len) {
        let val = if (target.resources[i] < limit.resources[i]) {
            target.resources[i]
        } else {
            limit.resources[i]
        };
        vector::push_back(&mut result, val);
        i = i + 1;
    };
    ResourceVector { resources: result }
}

public fun ge(a: &ResourceVector, b: &ResourceVector): bool {
    let len = vector::length(&a.resources);
    let mut i = 0;
    while (i < len) {
        if (a.resources[i] < b.resources[i]) { return false };
        i = i + 1;
    };
    true
}
