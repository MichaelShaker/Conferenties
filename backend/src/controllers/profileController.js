const profileService = require("../services/profileService");

async function getMyProfile(req, res) {
    try {
        const profile = await profileService.getProfileByUserId(req.user.id);

        res.json({
            success: true,
            data: profile || null
        });
    } catch (error) {
        console.error("Error fetching profile:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not fetch profile"
        });
    }
}

async function updateMyProfile(req, res) {
    try {
        const profile = await profileService.upsertProfile(req.user.id, req.body);

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: profile
        });
    } catch (error) {
        console.error("Error updating profile:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not update profile"
        });
    }
}

module.exports = {
    getMyProfile,
    updateMyProfile
};