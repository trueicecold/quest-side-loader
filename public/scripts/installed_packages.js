const getInstalledPackages = async () => {
    if (DEVICE_DATA.installed_packages && Object.keys(DEVICE_DATA.installed_packages).length > 0) {
        for (var package in DEVICE_DATA.installed_packages) {
            var installed_package = DEVICE_DATA.installed_packages[package];

            var package = $("#installed_package_template").html()
                .replace("$$ICON$$", installed_package.has_image ? "remote_assets/iconpack_quest/" + package  + ".jpg" : "")
                .replace("$$NAME$$", DEVICE_DATA.package_icons[package] ? DEVICE_DATA.package_icons[package].name : package)
                .replace("$$PACKAGE$$", package)
                .replace("$$VERSION$$", installed_package.version)

            $("#installed_packages_container").append(package);
        }
    }
    else {
        setTimeout(getInstalledPackages, 1000);
    }
}

getInstalledPackages();