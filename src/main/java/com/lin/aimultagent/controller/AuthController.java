package com.lin.aimultagent.controller;

import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.dto.request.AuthRequest;
import com.lin.aimultagent.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    // 🌟 不再直接注入 Repository，而是注入 Service
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Result register(@RequestBody AuthRequest req) {
        // 业务逻辑全部交给 Service 处理
        return userService.register(req);
    }

    @PostMapping("/login")
    public Result login(@RequestBody AuthRequest req) {
        // 业务逻辑全部交给 Service 处理
        return userService.login(req);
    }
}