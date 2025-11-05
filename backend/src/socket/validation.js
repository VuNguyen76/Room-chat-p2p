// Socket event validation utilities

const validateJoinRoom = (data) => {
    const errors = [];

    if (!data.roomId || typeof data.roomId !== 'string') {
        errors.push('roomId is required and must be a string');
    } else if (data.roomId.length < 3 || data.roomId.length > 50) {
        errors.push('roomId must be between 3 and 50 characters');
    }

    if (!data.displayName || typeof data.displayName !== 'string') {
        errors.push('displayName is required and must be a string');
    } else if (data.displayName.trim().length === 0) {
        errors.push('displayName cannot be empty');
    } else if (data.displayName.length > 100) {
        errors.push('displayName must be less than 100 characters');
    }

    if (data.avatarUrl && typeof data.avatarUrl !== 'string') {
        errors.push('avatarUrl must be a string');
    }

    return errors;
};

const validateMessage = (data) => {
    const errors = [];

    if (!data.roomId || typeof data.roomId !== 'string') {
        errors.push('roomId is required and must be a string');
    }

    if (!data.content || typeof data.content !== 'string') {
        errors.push('content is required and must be a string');
    } else if (data.content.trim().length === 0) {
        errors.push('content cannot be empty');
    } else if (data.content.length > 5000) {
        errors.push('content must be less than 5000 characters');
    }

    return errors;
};

const validateMediaEvent = (data) => {
    const errors = [];
    const validTypes = ['mute', 'unmute', 'video-off', 'video-on', 'screen-on', 'screen-off'];

    if (!data.roomId || typeof data.roomId !== 'string') {
        errors.push('roomId is required and must be a string');
    }

    if (!data.type || typeof data.type !== 'string') {
        errors.push('type is required and must be a string');
    } else if (!validTypes.includes(data.type)) {
        errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }

    return errors;
};

const validateSignaling = (data, requireSdp = true) => {
    const errors = [];

    if (!data.to || typeof data.to !== 'string') {
        errors.push('to is required and must be a string (target socket ID)');
    }

    if (requireSdp) {
        if (!data.sdp) {
            errors.push('sdp is required');
        }
        // Accept both string and object (RTCSessionDescriptionInit)
        if (typeof data.sdp !== 'string' && typeof data.sdp !== 'object') {
            errors.push('sdp must be a string or object');
        }
    } else {
        if (!data.candidate) {
            errors.push('candidate is required');
        }
    }

    return errors;
};

module.exports = {
    validateJoinRoom,
    validateMessage,
    validateMediaEvent,
    validateSignaling
};
