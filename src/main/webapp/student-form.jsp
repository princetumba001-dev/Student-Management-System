<%@ page contentType="text/html;charset=UTF-8" %><%@ include file="_layout-top.jspf" %>
<h1>${s.id==0?'Add':'Edit'} Student</h1><c:if test="${not empty error}"><div class="err">${fn:escapeXml(error)}</div></c:if>
<form class="card" method="post" action="students"><input type="hidden" name="id" value="${s.id}"><div class="form">
<div><label>Student ID *</label><input name="code" required value="${fn:escapeXml(s.code)}"></div>
<div><label>Full Name *</label><input name="name" required value="${fn:escapeXml(s.name)}"></div>
<div><label>Gender *</label><select name="gender"><c:forEach var="g" items="Male,Female,Other"><option ${s.gender==g?'selected':''}>${g}</option></c:forEach></select></div>
<div><label>Date of Birth *</label><input type="date" name="dob" required value="${s.dob}"></div>
<div><label>Email *</label><input type="email" name="email" required value="${fn:escapeXml(s.email)}"></div>
<div><label>Mobile (10 digits) *</label><input name="phone" required pattern="\d{10}" value="${fn:escapeXml(s.phone)}"></div>
<div><label>Department *</label><select name="deptId" required><option value="">Select</option><c:forEach var="d" items="${depts}"><option value="${d.key}" ${d.key==s.deptId?'selected':''}>${fn:escapeXml(d.value)}</option></c:forEach></select></div>
<div><label>Semester *</label><select name="semester"><c:forEach var="i" begin="1" end="8"><option ${s.semester==i?'selected':''}>${i}</option></c:forEach></select></div>
<div><label>Status</label><select name="status"><option ${s.status=='Inactive'?'':'selected'}>Active</option><option ${s.status=='Inactive'?'selected':''}>Inactive</option></select></div>
<div style="grid-column:1/-1"><label>Address</label><textarea name="address" rows="2">${fn:escapeXml(s.address)}</textarea></div></div><br>
<button class="btn">Save Student</button> <button type="reset" class="btn g">Reset</button> <a class="btn g" href="students">Cancel</a></form>
<%@ include file="_layout-bottom.jspf" %>
