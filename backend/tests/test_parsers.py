import pytest
from pathlib import Path
from app.analyzer.parsers.python_parser import PythonParser
from app.analyzer.parsers.ts_js_parser import TsJsParser
from app.analyzer.parsers.java_parser import JavaParser


def test_python_parser_ast():
    code = """
import os
from fastapi import FastAPI, Depends
from app.models import User

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    '''Fetch user details from database.'''
    if user_id <= 0:
        return {"error": "Invalid ID"}
    return {"user_id": user_id}

class UserService:
    def authenticate(self, token: str):
        return token == "valid"
"""
    parser = PythonParser()
    result = parser.parse_file(Path("api_routes.py"), "src/api_routes.py", code)

    assert result.language == "Python"
    assert result.role == "api_route"
    assert any(fn.name == "get_user" for fn in result.functions)
    assert any(c.name == "UserService" for c in result.classes)
    assert any("fastapi" in imp.source for imp in result.imports)


def test_ts_js_parser():
    code = """
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { User } from '../types';

export const UserCard = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    apiClient.get(`/users/${userId}`);
  }, [userId]);

  return <div className="card">{user?.name}</div>;
};

export default UserCard;
"""
    parser = TsJsParser()
    result = parser.parse_file(Path("UserCard.tsx"), "src/components/UserCard.tsx", code)

    assert result.language == "TypeScript"
    assert result.role == "component"
    assert any("api/client" in imp.source for imp in result.imports)
    assert any(exp.name == "UserCard" for exp in result.exports)


def test_java_parser():
    code = """
package com.example.service;

import org.springframework.stereotype.Service;
import com.example.model.Order;

@Service
public class OrderService {
    public Order processOrder(String orderId) {
        if (orderId == null) {
            return null;
        }
        return new Order(orderId);
    }
}
"""
    parser = JavaParser()
    result = parser.parse_file(Path("OrderService.java"), "src/main/java/com/example/service/OrderService.java", code)

    assert result.language == "Java"
    assert result.role == "service"
    assert any(c.name == "OrderService" for c in result.classes)
    assert any(fn.name == "processOrder" for fn in result.functions)
