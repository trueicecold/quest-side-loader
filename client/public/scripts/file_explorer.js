let selectedAPK = {
};

const changeDrive = () => {
    getFileList($("#drive_selector").val());
}

const getFileList = async (dir_path = "d:/torrent downloads/quest 2") => {
    dir_path += "\\";
    $.post("/api/file_list", { path: dir_path }, (data) => {
        $("#files_container").empty();
        $("#path").val(data.path);
        
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
                        else {
                            selectedAPK.install = false;
                            $("#install_detected").hide();
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

const installPackage = () => {
    $.post("/api/queue", {type: 0, params: selectedAPK}, (data) => {
        if (data.status == 1) {
            createAlert("Installation added to queue.", "success");
        }
    });
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