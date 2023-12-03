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
    uninstallRow = row;
    uninstallPackageName = $(row).data("package");
    $("#uninstall_package_modal").modal("show");
    $(".uninstall_package_name").html(uninstallPackageName);
}

const uninstallPackage = async () => {
    $.post("/api/uninstall_package", { package: uninstallPackageName }, (data) => {
        if (data) {
            if (data.status) {
                $("#uninstall_package_modal").modal("hide");
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

const backupApp = async (row) => {
    $("#backup_progress").modal("show");
    $("#backup_progress_caption").html("Backing up app");
    $("#progress_stage").removeClass().addClass("badge badge-warning").html("Processing");
    $("#backup_type").html("App");    
    $.post("/api/backup_app", { package: $(row).data("package") }, (data) => {
        if (data) {
            if (data.status) {
                $("#progress_stage").removeClass().addClass("badge badge-primary").html("Done");
            }
            else {
                $("#progress_stage").removeClass().addClass("badge badge-danger").html("Failed");
                $("#backup_error").html("Failed to backup app: " + data.error);
            }
        }
        else {
            $("#progress_stage").removeClass().addClass("badge badge-danger").html("Failed");
            $("#backup_error").html("Failed to backup app");
        }
        $("#close_button").removeAttr("disabled");
    });
}

const backupData = async (row) => {
    $("#backup_progress").modal("show");
    $("#backup_progress_caption").html("Backing up app data");
    $("#progress_stage").removeClass().addClass("badge badge-warning").html("Processing");
    $("#backup_type").html("App data");
    $.post("/api/backup_data", { package: $(row).data("package") }, (data) => {
        if (data) {
            if (data.status) {
                $("#progress_stage").removeClass().addClass("badge badge-primary").html("Done");
            }
            else {
                $("#progress_stage").removeClass().addClass("badge badge-danger").html("Failed");
                $("#backup_error").html("Failed to backup app data: " + data.error);
            }
        }
        else {
            $("#progress_stage").removeClass().addClass("badge badge-danger").html("Failed");
            $("#backup_error").html("Failed to backup app data");
        }
        $("#close_button").removeAttr("disabled");
    });
}

getInstalledPackages();