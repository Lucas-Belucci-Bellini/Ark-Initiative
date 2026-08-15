//! ARCA Field Core: deterministic, local-only validation for public hazards.
//! No network, user identifier, location, authority contact or dispatch action
//! exists in this module. It only classifies already-published public data.

#![no_std]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

/// Classifies a public hazard for interface emphasis only.
///
/// Alert levels: 0 unknown, 1 green, 2 yellow, 3 orange, 4 red.
/// The magnitude is passed as a value multiplied by ten (e.g. 7.4 -> 74).
/// Returns: 0 monitor, 1 attention, 2 elevated, 3 critical.
#[no_mangle]
pub extern "C" fn classify_public_risk(alert_level: i32, magnitude_x10: i32) -> i32 {
    if alert_level >= 4 || magnitude_x10 >= 70 {
        3
    } else if alert_level >= 3 || magnitude_x10 >= 60 {
        2
    } else if alert_level == 2 || magnitude_x10 >= 45 {
        1
    } else {
        0
    }
}

/// Returns 1 only if a cached package is still within the declared window.
/// This prevents the interface from presenting expired data as current.
#[no_mangle]
pub extern "C" fn packet_is_fresh(age_minutes: i32, max_age_minutes: i32) -> i32 {
    if age_minutes >= 0 && max_age_minutes > 0 && age_minutes <= max_age_minutes {
        1
    } else {
        0
    }
}
