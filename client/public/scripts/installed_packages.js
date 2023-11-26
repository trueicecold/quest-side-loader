const getInstalledPackages = async () => {
    $("#installed_packages_container").empty();
    if (DEVICE_DATA.installed_packages && Object.keys(DEVICE_DATA.installed_packages).length > 0) {
        for (var package in DEVICE_DATA.installed_packages) {
            var installed_package = DEVICE_DATA.installed_packages[package];
            var package = $("#installed_package_template").html()
                .replace("$$ICON$$", installed_package.image)
                .replace("$$NAME$$", installed_package.name)
                .replace(/\$\$PACKAGE\$\$/g, installed_package.package)
                .replace("$$VERSION$$", installed_package.version)

            $("#installed_packages_container").append(package);
        }
    }
    else {
        setTimeout(getInstalledPackages, 1000);
    }
}

let uninstallRow = null;
let uninstallPackageName = null;
const showUninstallModal = async (row) => {
    uninstallRow = $(row).data("package");
    uninstallPackageName = $(row).data("package");
    $("#uninstall_package_modal").modal("show");
    $(".uninstall_package_name").html(uninstallPackageName);
}

const uninstallPackage = async () => {
    $.post("/api/uninstall_package", { package: uninstallPackageName }, (data) => {
        if (data) {
            if (data.status) {
                uninstallRow.remove();
            }
            else {
                alert("Failed to uninstall package: " + data.error);
            }
        }
        else {
            alert("Failed to uninstall package");
        }
    });
}

getInstalledPackages();