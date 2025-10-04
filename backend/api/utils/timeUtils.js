// ================= TIME UTILS =================
// Standardized timezone conversion utilities
// ================================================

/**
 * Get current IST time as Date
 * @returns {Date} Current date/time in IST
 */
function getCurrentISTTime() {
    // Use Intl API for reliable timezone conversion
    const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    return new Date(istString);
}

/**
 * Get current IST time string in HH:MM
 * @returns {string}
 */
function getCurrentISTTimeString() {
    const ist = getCurrentISTTime();
    const hours = ist.getHours().toString().padStart(2, "0");
    const minutes = ist.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

/**
 * Check if current IST time is within any allowed time slots
 */
function isWithinAllowedTimeSlots(timeSlots) {
    try {
        const current = getCurrentISTTime();
        const currentMinutes = current.getHours() * 60 + current.getMinutes();

        console.log(`🕐 Time check - Current IST: ${current.toLocaleTimeString("en-IN")}, Checking ${timeSlots.length} slots`);

        const timeToMinutes = (timeStr) => {
            const [h, m] = timeStr.split(":").map(Number);
            return h * 60 + m;
        };

        for (const slot of timeSlots) {
            const startMinutes = timeToMinutes(slot.start);
            const endMinutes = timeToMinutes(slot.end);

            let isInSlot = false;

            if (startMinutes > endMinutes) {
                isInSlot = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
            } else {
                isInSlot = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            }

            console.log(
                `🕐 Slot check - ${slot.start}-${slot.end}: Current ${currentMinutes}min, Start ${startMinutes}, End ${endMinutes}, InSlot: ${isInSlot}`
            );

            if (isInSlot) return true;
        }

        console.log("🕐 Not in any allowed slot");
        return false;
    } catch (err) {
        console.error("❌ Error in time slot check:", err);
        return true;
    }
}

/**
 * Parse time slots from ENV
 */
function parseTimeSlotsFromEnv() {
    const env = process.env.PRODUCT_DISPLAY_TIME_SLOTS;
    if (!env) return [{ start: "06:30", end: "18:30" }];

    try {
        return env.split(",").map((slot) => {
            const [start, end] = slot.trim().split("-");
            if (!start || !end) throw new Error("Invalid slot: " + slot);
            return { start: start.trim(), end: end.trim() };
        });
    } catch (err) {
        console.error("❌ Error parsing slots:", err);
        return [{ start: "06:30", end: "18:30" }];
    }
}

/**
 * Get product display hours
 */
function getProductDisplayHours() {
    const slots = parseTimeSlotsFromEnv();
    return {
        timeSlots: slots,
        formattedSlots: slots.map((s) => `${s.start}-${s.end}`).join(", "),
        startTime: slots[0]?.start || "06:30",
        endTime: slots[0]?.end || "18:30",
    };
}

/**
 * Should products be displayed?
 */
function shouldDisplayProducts() {
    const { timeSlots } = getProductDisplayHours();
    return isWithinAllowedTimeSlots(timeSlots);
}

/**
 * Convert any timestamp to IST ISO string
 */
function convertToIST(timestamp) {
    if (!timestamp) return null;
    try {
        // Use Intl API for reliable timezone conversion
        const istString = new Date(timestamp).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        return new Date(istString).toISOString();
    } catch (err) {
        console.error("❌ Error converting timestamp:", err, "Input:", timestamp);
        return null;
    }
}

/**
 * Convert timestamp to IST formatted string for display
 */
function formatTimestampToIST(timestamp) {
    if (!timestamp) return null;
    try {
        // Use Intl.DateTimeFormat for reliable timezone conversion
        const date = new Date(timestamp);
        const istDate = new Intl.DateTimeFormat("en-IN", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        }).format(date);

        return istDate;
    } catch (err) {
        console.error("❌ Error formatting timestamp to IST:", err, "Input:", timestamp);
        return null;
    }
}

/**
 * Convert timestamp to IST date only (DD/MM/YYYY format)
 */
function formatDateToIST(timestamp) {
    if (!timestamp) return null;
    try {
        // Use Intl.DateTimeFormat for reliable timezone conversion
        const date = new Date(timestamp);
        const istDate = new Intl.DateTimeFormat("en-IN", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Kolkata'
        }).format(date);

        return istDate;
    } catch (err) {
        console.error("❌ Error formatting date to IST:", err, "Input:", timestamp);
        return null;
    }
}

/**
 * Convert multiple timestamps to IST
 */
function convertTimestampsToIST(data, fields = ["created_at", "updated_at", "date", "timestamp"]) {
    if (!data || typeof data !== "object") return data;
    const converted = { ...data };
    fields.forEach((f) => {
        if (converted[f]) {
            converted[f] = convertToIST(converted[f]);
        }
    });
    return converted;
}

/**
 * Convert multiple timestamps to formatted IST strings for frontend display
 */
function formatTimestampsForDisplay(data, fields = ["created_at", "updated_at", "date", "timestamp"]) {
    if (!data || typeof data !== "object") return data;
    const formatted = { ...data };
    fields.forEach((f) => {
        if (formatted[f]) {
            formatted[f] = formatTimestampToIST(formatted[f]);
        }
    });
    return formatted;
}

/**
 * Convert multiple timestamps to IST date strings (DD/MM/YYYY format)
 */
function formatDatesForDisplay(data, fields = ["created_at", "updated_at", "date", "timestamp"]) {
    if (!data || typeof data !== "object") return data;
    const formatted = { ...data };
    fields.forEach((f) => {
        if (formatted[f]) {
            formatted[f] = formatDateToIST(formatted[f]);
        }
    });
    return formatted;
}

/**
 * Debug info
 */
function getISTTimeInfo() {
    const ist = getCurrentISTTime();
    const { timeSlots, formattedSlots, startTime, endTime } = getProductDisplayHours();
    const isAllowed = shouldDisplayProducts();

    return {
        currentIST: ist.toISOString(),
        currentTimeString: ist.toLocaleTimeString("en-IN"),
        timeSlots,
        formattedSlots,
        startTime,
        endTime,
        isAllowed,
        timezone: "IST (Asia/Kolkata)",
    };
}

module.exports = {
    getCurrentISTTime,
    getCurrentISTTimeString,
    isWithinAllowedTimeSlots,
    parseTimeSlotsFromEnv,
    getProductDisplayHours,
    shouldDisplayProducts,
    getISTTimeInfo,
    convertToIST,
    formatTimestampToIST,
    formatDateToIST,
    convertTimestampsToIST,
    formatTimestampsForDisplay,
    formatDatesForDisplay,
};
