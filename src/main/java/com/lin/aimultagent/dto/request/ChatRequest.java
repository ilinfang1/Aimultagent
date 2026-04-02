package com.lin.aimultagent.dto.request;

// 🌟 增加 imageBase64 字段，用于接收前端传来的图片数据
public record ChatRequest(String message, String imageBase64) {
}