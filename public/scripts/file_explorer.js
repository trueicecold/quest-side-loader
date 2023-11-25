let selectedAPK = {

};

const changeDrive = () => {
    getFileList($("#drive_selector").val());
}

const getFileList = async (dir_path = "d:/torrent downloads/quest 2") => {
    dir_path += "\\";
    $.post("/api/file_list", { path: dir_path }, (data) => {
        $("#files_container").empty();
        
        var apks = data.files.filter(file => file.name.endsWith(".apk"));

        if (dir_path.indexOf("/") > -1) {
            var directory = $($("#file_entry_template").html()
                .replace(/\$\$NAME\$\$/ig, "..")
                .replace("$$ICON$$", "<i class='fa fa-folder'></i>")
                .replace("$$SIZE$$", "")
                .replace("$$LAST_MODIFIED$$", ""));
            
            directory.on("click", function() {
                getFileList(dir_path.substring(0, dir_path.lastIndexOf("/")));
            });
            
            $("#files_container").append(directory);
        }

        for (var i=0;i<data.directories.length;i++) {
            var directory = $($("#file_entry_template").html()
                .replace(/\$\$NAME\$\$/ig, data.directories[i].name)
                .replace("$$ICON$$", apks.filter(apk => apk.name.replace(".apk", "") == data.directories[i].name).length > 0 ? "<li class='fa fa-folder'></li>&nbsp;<span class='obb'>OBB</span>" : "<i class='fa fa-folder'></i>")
                .replace("$$SIZE$$", "")
                .replace("$$LAST_MODIFIED$$", formatDate(data.directories[i].last_modified)));
            
            directory.on("click", function() {
                getFileList(dir_path + "/" + $(this).data("path"));
            });
            
            $("#files_container").append(directory);
        }

        for (var i = 0; i < data.files.length; i++) {
            if (data.files[i].name.endsWith(".apk") || data.files[i].name.toLowerCase() == "install.txt") {
                var file = $($("#file_entry_template").html()
                    .replace(/\$\$NAME\$\$/ig, data.files[i].name)
                    .replace("$$ICON$$", data.files[i].name.toLowerCase() == "install.txt" ? "<li class='fa fa-file'></li>&nbsp;<span class='install'>INSTALL</span>" : "<li class='fa fa-file'></li>&nbsp;<span class='apk'>APK</span>")
                    .replace("$$SIZE$$", humanFileSize(data.files[i].size))
                    .replace("$$LAST_MODIFIED$$", formatDate(data.files[i].last_modified)));

                if (!data.has_install || data.files[i].name.toLowerCase() == "install.txt") {
                    file.on("click", function () {
                        selectedAPK.path = dir_path + "/" + $(this).data("path");
                        selectedAPK.obb = false;
                        
                        $("#obb_detected").hide();
                        
                        if (data.directories.filter(directory => directory.name == $(this).data("path").replace(".apk", "")).length > 0) {
                            selectedAPK.obb = true;
                            $("#obb_detected").show();
                        }

                        if (data.files.filter(file => file.name.toLowerCase() == "install.txt").length > 0) {
                            selectedAPK.install = true;
                            $("#install_detected").show();
                        }

                        $(".install_package_name").html($(this).data("path"));
                        $("#install_package_modal").modal("show");
                    });
                }
                else {
                    file.addClass("disabled");
                }
                $("#files_container").append(file);
            }
        }
    });
}

let installProgressInterval;
const getInstallProgress = () => {
    $.get("/api/install_progress", (data) => {
        if (!installFailed) {
            $("#install_package_progress .modal-body .badge").each((index, item) => {
                if (index < $("#progress_" + data.state).index(".modal-body .badge")) {
                    $(item).removeClass("badge-warning").addClass("badge-primary");
                    $(item).html("Done");
                }
            });

            $("#progress_" + data.state).addClass("badge-warning");
            $("#progress_" + data.state).html("Processing");
            
            if (data.state == "copying_apk") {
                $("#apk_progress").html(humanFileSize(data.transferred) + " out of " + humanFileSize(data.total) + " (" + ((data.transferred / data.total) * 100).toFixed(1) + "%)");
            }
            else {
                $("#apk_progress").html("");
            }

            if (data.state == "copying_obb" || data.state == "running_install") {
                $("#progress_" + data.state).html(data.fileIndex + " / " + data.fileTotal);
            }
            else {
                $("#copying_obb_progress_caption");
                $("#running_install_progress_caption");
            }
            if (data.state == "copying_obb") {
                $("#" + data.state + "_progress_caption").html(humanFileSize(data.transferred) + " out of " + humanFileSize(data.total) + " (" + ((data.transferred / data.total) * 100).toFixed(1) + "%)");
            }
        }
    });
}

let installFailed = false;
const installPackage = () => {
    installFailed = false;
    if (selectedAPK.install) {
        $("#install_txt_progress").removeAttr("hidden");
        $("#regular_txt_progress").hide();
    }
    else {
        $("#install_txt_progress").attr("hidden", "");
        $("#regular_txt_progress").show();
    }
    $("#install_package_progress .modal-body .badge").removeClass().addClass("badge");
    $("#install_package_modal").modal("hide");
    $("#install_package_progress").modal("show");
    $.post("/api/install_package", selectedAPK, (data) => {
        if (data.status == 1) {
            clearInterval(installProgressInterval);
            $("#install_package_progress .modal-body .badge").removeClass().addClass("badge").addClass("badge-primary");
            $("#install_package_progress .modal-body .badge").html("Done");
        }
        else {
            installFailed = true;
            $("#progress_running_install").removeClass("badge-warning").addClass("badge-danger").html("Failed");
            $("#progress_" + data.state).removeClass("badge-warning").addClass("badge-danger").html("Failed");
            $("#install_error").html(data.error);
        }
    }).always(() => {
        $("#install_package_progress #close_button").removeAttr("disabled");
    });
    getInstallProgress();
    clearInterval(installProgressInterval);
    installProgressInterval = setInterval(getInstallProgress, 1000);
}

$.get("/api/drive_list", (data) => {
    $("#drive_selector").empty();
    for (var i=0;i<data.length;i++) {
        var drive = $("<option></option>");
        drive.html(data[i]);
        $("#drive_selector").append(drive);
    }
    $("#drive_selector").SumoSelect();
    changeDrive();
});