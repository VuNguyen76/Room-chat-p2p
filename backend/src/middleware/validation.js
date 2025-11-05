// Validation middleware for request data

const validateCreateRoom = (req, res, next) => {
    const { title, maxParticipants, createdBy } = req.body;

    const errors = [];

    // Validate createdBy
    if (!createdBy) {
        errors.push('createdBy is required');
    } else {
        if (!createdBy.displayName || typeof createdBy.displayName !== 'string') {
            errors.push('createdBy.displayName is required and must be a string');
        }
        if (createdBy.displayName && createdBy.displayName.trim().length === 0) {
            errors.push('createdBy.displayName cannot be empty');
        }
        if (createdBy.displayName && createdBy.displayName.length > 100) {
            errors.push('createdBy.displayName must be less than 100 characters');
        }
    }

    // Validate title
    if (title !== undefined) {
        if (typeof title !== 'string') {
            errors.push('title must be a string');
        } else if (title.length > 200) {
            errors.push('title must be less than 200 characters');
        }
    }

    // Validate maxParticipants
    if (maxParticipants !== undefined) {
        if (typeof maxParticipants !== 'number') {
            errors.push('maxParticipants must be a number');
        } else if (maxParticipants < 2 || maxParticipants > 10) {
            errors.push('maxParticipants must be between 2 and 10');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors
        });
    }

    next();
};

const validateRoomId = (req, res, next) => {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'roomId is required and must be a string'
        });
    }

    if (roomId.length < 3 || roomId.length > 50) {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'roomId must be between 3 and 50 characters'
        });
    }

    next();
};

const validateMessageQuery = (req, res, next) => {
    const { before, after, limit } = req.query;

    const errors = [];

    if (before && after) {
        errors.push('Cannot use both before and after parameters');
    }

    if (before && isNaN(Date.parse(before))) {
        errors.push('before must be a valid ISO date string');
    }

    if (after && isNaN(Date.parse(after))) {
        errors.push('after must be a valid ISO date string');
    }

    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            errors.push('limit must be a number between 1 and 100');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors
        });
    }

    next();
};

module.exports = {
    validateCreateRoom,
    validateRoomId,
    validateMessageQuery
};
