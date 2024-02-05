/*
* Flat Pyramid-style Metronome using HTML5 Web Audio API and CSS3 Keyframe Animations.
*
* Forked from Dylan Paulus' Pen "Simple Metronome" (http://codepen.io/ganderzz/pen/Ezlfu/), with the help of Chris Wilson's Tut "Scheduling Web Audio with Precision" (http://www.html5rocks.com/en/tutorials/audio/scheduling/).
* Design based on Alex Bergin's "M-Metronome" (http://codepen.io/abergin/pen/efbCD).
*
* Copyright 2015 GetSongBPM.com
* This project is licensed under the MIT License (see the LICENSE.md for details)
*/

// Defaults
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = null; // 将 AudioContext 初始化为 null
var timer, noteCount, counting, _interval = null;
var curTime = 0.0;

// 在用户点击页面的时候启动 AudioContext
document.addEventListener('click', function() {
    // 检查是否已经存在 AudioContext，如果没有则创建一个
    if (!context) {
        context = new AudioContext();
    }

    // 现在可以启动 AudioContext
    context.resume().then(function() {
        console.log('AudioContext 已经启动');
        // 在这里继续您的代码逻辑，包括调用 schedule() 或其他音频操作
    }).catch(function(err) {
        console.error('无法启动 AudioContext: ' + err);
    });
});

// 当页面加载完成后执行，显示节拍
$("document").ready(function() {

    showBeats();
});

// 调度器，用于精确地定时播放节拍声音
function schedule() {
    while (curTime < context.currentTime + 0.1) {
        playNote(curTime);
        updateTime();
    }
    timer = window.setTimeout(schedule, 0.1);
}

// 将BPM（每分钟拍数）转换为时间
function updateTime() {
    curTime += seconds_perbeat();
    noteCount++;
}

// 计算每个拍子的时间间隔
function seconds_perbeat() {
    var current_tempo = parseInt($(".bpm-input").val(), 10);

    // 限制最小和最大的BPM值
    if (current_tempo < 40) {
        current_tempo = 40;
        $(".bpm-input").val(current_tempo);
    } else if (current_tempo > 210) {
        current_tempo = 210;
        $(".bpm-input").val(current_tempo);
    }

    var adjust_weight = current_tempo - 35;

    // 动态调整CSS样式以模拟钟摆效果
    $("<style>.swinging_pendulum:before { margin-top: " + adjust_weight + "px; }</style>").appendTo("head");

    var spb = 60 / current_tempo; // 计算每个拍子的时间间隔（秒）

    return spb;
}

// 在延迟时间t后播放音符
function playNote(t) {
    var note = context.createOscillator();

    if (noteCount == parseInt($(".new_beats").val(), 10))
        noteCount = 0;

    if ($(".beatcount .beat").eq(noteCount).hasClass("active")) {
        note.frequency.value = 380;
        var bgcolor = "19FA65";
    } else {
        note.frequency.value = 200;
        var bgcolor = "01C0F1";
    }

    note.connect(context.destination);

    note.start(t);
    note.stop(t + 0.05);

    $(".beatcount .beat").attr("style", "");

    $(".beatcount .beat").eq(noteCount).css({
        background: "#" + bgcolor
    });

    $(".current_beat").text(noteCount + 1);
}

// 调整钟摆速度
pendulum_speed();

function pendulum_speed() {
    var duration = seconds_perbeat() + 's';

    $('.swinging_pendulum').css({
        '-webkit-animation-duration': duration,
        '-moz-animation-duration': duration,
        '-o-animation-duration': duration,
        'animation-duration': duration
    });
}

// 增加或减少拍子的BPM
$(".slow-down, .speed-up").click(function() {
    if ($(this).hasClass("slow-down"))
        $(".bpm-input").val(parseInt($(".bpm-input").val(), 10) - 1);
    else
        $(".bpm-input").val(parseInt($(".bpm-input").val(), 10) + 1);

    $(this).blur();

    pendulum_speed();
});

// 允许使用键盘控制
$(document).on('keydown', function(e) {
    var amount = 1;

    if (e.shiftKey)
        amount = 10;

    if (e.keyCode == 107 || e.keyCode == 39) { // + 或者 ->
        $(".bpm-input").val(parseInt($(".bpm-input").val(), 10) + amount);
        pendulum_speed();
    } else if (e.keyCode == 109 || e.keyCode == 37) { // - 或者 <-
        $(".bpm-input").val(parseInt($(".bpm-input").val(), 10) - amount);
        pendulum_speed();
    } else if (e.keyCode == 32) { // 空格键
        metronome_switch();
    } else if (e.keyCode == 13) { // 回车键
        if (!$('.swinging_pendulum').hasClass('animate_pendulum'))
            metronome_on();
    } else if (e.keyCode == 27) { // Escape键
        metronome_off();
    }
});

// 启动/停止节拍器
$("#metronome_switcher").on("click", function() {
    metronome_switch();
});

// 切换节拍器的状态
function metronome_switch() {
    if ($('.swinging_pendulum').hasClass('animate_pendulum'))
        metronome_off();
    else
        metronome_on();
}

// 启动节拍器
function metronome_on() {
    curTime = context.currentTime;
    noteCount = parseInt($(".new_beats").val(), 10);
    schedule();

    $("#metronome_switcher").prop("checked", true);

    // 钟摆动画
    $('.swinging_pendulum').addClass('animate_pendulum');
    _interval = setInterval(function() {}, seconds_perbeat() * 1000);
}

// 停止节拍器
function metronome_off() {
    counting = false;
    window.clearInterval(timer);

    $("#metronome_switcher").prop("checked", false);
    $(".beatcount .beat").attr("style", "");
    $(".current_beat").empty();

    // 钟摆动画
    $('.swinging_pendulum').removeClass('animate_pendulum');
    clearInterval(_interval);
    _interval = null;
}

// 每拍的数量
$(document).mouseup(function(e) {
    var ts = $(".per_measure");

    if ($(e.target).is('.n_beats_change') || (ts.is(":visible") && !ts.is(e.target) && ts.has(e.target).length === 0))
        ts.toggle(200);
});

// 根据新的拍子数量显示节拍
function showBeats() {
    for (var i = 0; i < $(".new_beats").val(); i++) {
        var temp = document.createElement("div");
        temp.className = "beat";

        if (i === 0)
            temp.className += " active";

        $(".beatcount").append(temp);
    }
}

// 启用/禁用强调拍子
$(document).on("click", ".beatcount .beat", function() {
    $(this).toggleClass("active");
});

// 当拍子数量改变时添加/移除点
$(".new_beats").on("change", function() {
    var _counter = $(".beatcount");
    _counter.html("");

    var time_sig = $(".new_beats").val();

    if (time_sig < noteCount)
        noteCount = 0;

    showBeats();

    if ($(".per_measure").is(":visible"))
        $(".per_measure").toggle(200);
});
