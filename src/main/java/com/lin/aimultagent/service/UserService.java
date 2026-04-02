package com.lin.aimultagent.service;

import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.dto.request.AuthRequest;

/**
 * 用户业务逻辑接口
 */
public interface UserService {

    // 注册业务
    Result register(AuthRequest req);

    // 登录业务
    Result login(AuthRequest req);
}