package com.edumanage;
import java.sql.*; import java.util.*;
public class StudentDAO {
    private static final String SEL = "SELECT s.*, d.name dept FROM students s JOIN departments d ON d.id=s.department_id ";
    private Student map(ResultSet r) throws SQLException {
        Student s = new Student(); s.setId(r.getInt("id")); s.setCode(r.getString("student_code")); s.setName(r.getString("full_name"));
        s.setGender(r.getString("gender")); s.setDob(r.getString("dob")); s.setEmail(r.getString("email")); s.setPhone(r.getString("phone"));
        s.setAddress(r.getString("address")); s.setDeptId(r.getInt("department_id")); s.setDept(r.getString("dept"));
        s.setSemester(r.getInt("semester")); s.setStatus(r.getString("status")); return s;
    }
    public List<Student> search(String q, int dept) throws SQLException {
        String sql = SEL + "WHERE (s.full_name LIKE ? OR s.student_code LIKE ? OR s.email LIKE ?) AND (?=0 OR s.department_id=?) ORDER BY s.id DESC";
        try (Connection c = DBConnection.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            String k = "%" + q + "%"; ps.setString(1, k); ps.setString(2, k); ps.setString(3, k); ps.setInt(4, dept); ps.setInt(5, dept);
            List<Student> out = new ArrayList<>(); try (ResultSet r = ps.executeQuery()) { while (r.next()) out.add(map(r)); } return out;
        }
    }
    public Student find(int id) throws SQLException {
        try (Connection c = DBConnection.get(); PreparedStatement ps = c.prepareStatement(SEL + "WHERE s.id=?")) {
            ps.setInt(1, id); try (ResultSet r = ps.executeQuery()) { return r.next() ? map(r) : null; }
        }
    }
    public void save(Student s) throws SQLException {
        String sql = s.getId() == 0
            ? "INSERT INTO students(student_code,full_name,gender,dob,email,phone,address,department_id,semester,status) VALUES(?,?,?,?,?,?,?,?,?,?)"
            : "UPDATE students SET student_code=?,full_name=?,gender=?,dob=?,email=?,phone=?,address=?,department_id=?,semester=?,status=? WHERE id=?";
        try (Connection c = DBConnection.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, s.getCode()); ps.setString(2, s.getName()); ps.setString(3, s.getGender()); ps.setString(4, s.getDob());
            ps.setString(5, s.getEmail()); ps.setString(6, s.getPhone()); ps.setString(7, s.getAddress());
            ps.setInt(8, s.getDeptId()); ps.setInt(9, s.getSemester()); ps.setString(10, s.getStatus());
            if (s.getId() != 0) ps.setInt(11, s.getId());
            ps.executeUpdate();
        }
    }
    public void delete(int id) throws SQLException {
        try (Connection c = DBConnection.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM students WHERE id=?")) { ps.setInt(1, id); ps.executeUpdate(); }
    }
    public Map<Integer, String> departments() throws SQLException {
        Map<Integer, String> m = new LinkedHashMap<>();
        try (Connection c = DBConnection.get(); Statement st = c.createStatement(); ResultSet r = st.executeQuery("SELECT id,name FROM departments ORDER BY name")) { while (r.next()) m.put(r.getInt(1), r.getString(2)); }
        return m;
    }
    public int count(String table) throws SQLException { // table is from a fixed whitelist, never user input
        if (!List.of("students", "teachers", "courses", "departments").contains(table)) throw new IllegalArgumentException();
        try (Connection c = DBConnection.get(); Statement st = c.createStatement(); ResultSet r = st.executeQuery("SELECT COUNT(*) FROM " + table)) { r.next(); return r.getInt(1); }
    }
}
