// 设置特殊显示日期
const MyBIrthday = "08-27";


// 获取今天日期
function getToday() {
    let date = new Date();

    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");

    return `${month}-${day}`;
}


// 打开弹窗
function openPopup() {
    document.getElementById("popupMask").style.display = "block";
}


// 关闭弹窗
function closePopup() {
    document.getElementById("popupMask").style.display = "none";

    // 记录普通弹窗已经显示
    localStorage.setItem("popupShown", "true");
}


// 页面加载
window.onload = function () {

    let today = getToday();


    // 特定日期弹窗
    if (today === MyBIrthday) {

        openPopup();

        // 可以换成特殊图片/文字
        document.querySelector(".popup-title").innerHTML = "";
        document.querySelector(".popup-text").innerHTML =
            "今天是我生日，我想听听那个😆";

        return;
    }


    // 普通弹窗只显示一次
    if (!localStorage.getItem("popupShown")) {

        openPopup();

    }

};