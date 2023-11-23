let DEVICE_DATA = {};

$(() => {
    autoConnect();
    getDeviceData();
    getPackageIcons();
    setInterval(getDeviceData, 5000);
});

const autoConnect = () => {
    $.get("/api/auto_connect", (data) => {
    });
}

const getOwnIP = () => {
    $.get("/api/own_ip", (data) => {
        $("#ip_address").val(data.ip);
    });
}

const connectDevice = () => {
    $(".mask").show();
    $.post("/api/device_connect", { serial: $("#ip_address").val()}, (data) => {
        if (data && data.status) {
            $(".mask .text").html("Loading Device Data");
            getDeviceData();
        }
    });
}

const disconnectDevice = () => {
    $.get("/api/device_disconnect", (data) => {
        if (data && data.status) {
            $("#device_info").hide();
            $("#not_connected").show();
            //getDeviceData();
        }
    });
}

const getPackageIcons = () => {
    $.get("remote_assets/appnames_quest.json", function (data) {
        DEVICE_DATA.package_icons = data;
    });
}

const getDeviceData = () => {
    $.get("/api/device_data", function (data) {
        if (data) {
            if (data.connected) {
                $(".mask").hide();
                $("#device_info").show();
                $("#not_connected").hide();
            }
            else {
                $("#device_info").hide();
                $("#not_connected").show();
            }

            //populate mount devices list
            $("#device_selector option:not(:last)").empty();
            if (data.devices) {
                for (var i = 0; i < data.devices.length;i++) {
                    var drive = $("<option></option>");
                    drive.html(data.devices[i].id);
                    drive.attr("selected", data.devices[i].id == data.connected_device ? "selected" : "");
                    $("#device_selector").prepend(drive);
                }
                $("#device_selector").SumoSelect();
            }
            
            DEVICE_DATA = {...DEVICE_DATA, ...data};
            $("#fw_version").html(data.firmware || "");
            $("#total_memory").html(data.memory ? humanFileSize(data.memory.total) : "");
            $("#free_memory").html(data.memory ? humanFileSize(data.memory.available) : "");
            $("#storage_progress").css("width", data.storage ? data.storage.percent : 0);
            $("#storage_progress_container").html((data.storage) ? data.storage.used + "/" + data.storage.size + " (" + data.storage.percent + ")" : "");
            $("#battery_level").html(data.battery.level ? data.battery.level + "%" : "");

            if (data.battery.charging) {
                $("#battery_charging").show();
            }
        }
    });
}

function humanFileSize(size) {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

const formatDate = (fullDateString) => {
    const date = new Date(fullDateString);

    const day = addZero(date.getDate());
    const month = addZero(date.getMonth() + 1);
    const year = date.getFullYear();
    const hour = addZero(date.getHours());
    const minute = addZero(date.getMinutes());

    const formattedDate = `${day}/${month}/${year} ${hour}:${minute}`;
    return formattedDate;
}

const addZero = (number) => {
    return number < 10 ? "0" + number : number;
}