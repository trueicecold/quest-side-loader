let selectedAPK = {

};

const changeDrive = () => {
    getFileList($("#drive_selector").val());
}

const getFileList = async (dir_path = "d:/torrent downloads/quest 2") => {
    $.post("/api/file_list", { path: dir_path }, (data) => {
        $("#files_container").empty();
        
        if (dir_path.indexOf("/") > -1) {
            var directory = $($("#file_entry_template").html()
                .replace(/\$\$NAME\$\$/ig, "..")
                .replace("$$ICON_CLASS$$", "fa-folder")
                .replace("$$SIZE$$", "")
                .replace("$$LAST_MODIFIED$$", ""));
            
            directory.on("click", function() {
                getFileList(dir_path.substring(0, dir_path.lastIndexOf("/")));
            });
            
            $("#files_container").append(directory);
        }

        for (var i=0;i<data.directories.length;i++) {
            var directory = $($("#file_entry_template").html()
                .replace(/\$\$NAME\$\$/ig, data.directories[i])
                .replace("$$ICON_CLASS$$", "fa-folder")
                .replace("$$SIZE$$", "")
                .replace("$$LAST_MODIFIED$$", ""));
            
            directory.on("click", function() {
                getFileList(dir_path + "/" + $(this).data("path"));
            });
            
            $("#files_container").append(directory);
        }

        for (var i = 0; i < data.files.length; i++) {
            if (data.files[i].endsWith(".apk")) {
                var file = $($("#file_entry_template").html()
                    .replace(/\$\$NAME\$\$/ig, data.files[i])
                    .replace("$$ICON_CLASS$$", "fa-file")
                    .replace("$$SIZE$$", "")
                    .replace("$$LAST_MODIFIED$$", ""));
                file.on("click", function () {
                    selectedAPK.path = dir_path + "/" + $(this).data("path");
                    selectedAPK.obb = false;
                    
                    $("#obb_detected").hide();
                    
                    if (data.directories.indexOf($(this).data("path").replace(".apk", "")) > -1) {
                        selectedAPK.obb = true;
                        $("#obb_detected").show();
                    }

                    if (data.files.indexOf("install.txt") > -1) {
                        $("#install_detected").show();
                    }

                    $(".install_package_name").html($(this).data("path"));
                    $("#install_package_modal").modal("show");
                });
                $("#files_container").append(file);
            }
        }
    });
}

let installProgressInterval;
const getInstallProgress = () => {
    $.get("/api/install_progress", (data) => {
        $("#install_package_progress .modal-body .badge").each((index, item) => {
            if (index < $("#progress_" + data.state).index(".modal-body .badge")) {
                $(item).removeClass("badge-warning").addClass("badge-primary");
                $(item).html("Done");
            }
        });

        $("#progress_" + data.state).addClass("badge-warning");
        $("#progress_" + data.state).html("Processing");
    });
}

const installPackage = () => {
    $("#install_package_progress .modal-body .badge").removeClass("badge-warning").removeClass("badge-primary");
    $("#install_package_modal").modal("hide");
    $("#install_package_progress").modal("show");
    $.post("/api/install_package", selectedAPK, (data) => {
        if (data.status == 1) {
            clearInterval(installProgressInterval);
            $("#install_package_progress .modal-body .badge").removeClass("badge-warning").addClass("badge-primary");
            $("#install_package_progress .modal-body .badge").html("Done");
        }
        else {
            alert(data.error);
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