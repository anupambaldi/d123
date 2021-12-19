const {
    models: {Version}
} = require('../../../../lib/models');

class SettingsController {

    async settingsPage(req, res) {
        let setting = await Version.findOne({});
        return res.render('setting', {setting});
    }

    async settingsUpdate(req, res) {
        const {
            androidAppVersion,
            androidForceUpdate,
            iosAppVersion,
            iosForceUpdate
        } = req.body;
        await Version.updateMany(
            {},
            {
                $set: {
                    androidAppVersion,
                    androidForceUpdate,
                    iosAppVersion,
                    iosForceUpdate
                },
            }
        );
        req.flash('success', req.__('SETTINGS_UPDATE_SUCCESS'));
        return res.redirect('/settings');
    }
}

module.exports = new SettingsController();


