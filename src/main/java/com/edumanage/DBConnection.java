package com.edumanage;
import java.sql.*;
public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/edumanage?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root", PASS = "root"; // change to your MySQL credentials
    public static Connection get() throws SQLException { return DriverManager.getConnection(URL, USER, PASS); }
}
