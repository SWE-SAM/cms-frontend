import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@remix-run/react";

import {
  Grid,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

import MainCard from "ui-component/cards/MainCard";
import { useAuth } from "context/AuthContext";
import { db } from "services/firebase.client";

import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";

export default function EditComplaintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [role, setRole] = useState(null);
  const [userCompanyId, setUserCompanyId] = useState(null); 
  const [complaint, setComplaint] = useState(null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [employeeComment, setEmployeeComment] = useState("");
  const [companyId, setCompanyId] = useState(""); 

  const [assignedToUid, setAssignedToUid] = useState("");
  const [employees, setEmployees] = useState([]);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/pages/login/login3", { replace: true });
    }
  }, [loading, user, navigate]);

  
  useEffect(() => {
    async function loadRole() {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setRole(data.role || "user");
        setUserCompanyId(data.companyId || null);
      }
    }
    loadRole();
  }, [user]);

  
  useEffect(() => {
    async function loadComplaint() {
      const snap = await getDoc(doc(db, "complaints", id));
      if (!snap.exists()) {
        setError("Complaint not found.");
        return;
      }

      const data = snap.data();
      setComplaint({ id: snap.id, ...data });
      setSubject(data.subject || "");
      setDescription(data.description || "");
      setStatus(data.status || "OPEN");
      setAssignedToUid(data.assignedToUid || "");
      setEmployeeComment(data.employeeComment || "");
      setCompanyId(data.companyId || "N/A");
    }
    loadComplaint();
  }, [id]);

  // Permissions 
  const isGlobalAdminOrManager = role === "admin" || role === "manager";
  const isCompanyManager = role === "companyManager";
  const isEmployee = role === "employee";
  
  
  const isSameCompany = complaint?.companyId === userCompanyId;
  const isOwner = user?.uid && complaint?.createdByUid === user.uid;
  const isAssignedEmployee = isEmployee && user?.uid && complaint?.assignedToUid === user.uid;

  
  const hasManagementRights = isGlobalAdminOrManager || (isCompanyManager && isSameCompany);

  const canEditFields = hasManagementRights || isOwner;
  const canEditStatus = hasManagementRights || isAssignedEmployee;
  const canEditComment = hasManagementRights || isAssignedEmployee;
  const canAssign = hasManagementRights;
  const canDelete = hasManagementRights;

  
  useEffect(() => {
    
    if (!canAssign || !complaint || !userCompanyId) return;

    async function loadEmployees() {
      try {
        let q;
        if (isCompanyManager) {
          // Filter by role AND companyId
          q = query(
            collection(db, "users"), 
            where("role", "==", "employee"),
            where("companyId", "==", userCompanyId)
          );
        } else {
          // Admins see all employees
          q = query(collection(db, "users"), where("role", "==", "employee"));
        }

        const snap = await getDocs(q);
        setEmployees(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading employees:", err);
        
        setError("Could not load employee list. Check console for index link.");
      }
    }

    loadEmployees();
  }, [canAssign, isCompanyManager, userCompanyId, complaint]);

  const handleSave = async () => {
    setError("");
    setMessage("");

    if (canEditFields && (!subject.trim() || !description.trim())) {
      setError("Subject and description are required.");
      return;
    }

    const updates = { updatedAt: serverTimestamp() };

    if (canEditFields) {
      updates.subject = subject.trim();
      updates.description = description.trim();
    }
    if (canEditStatus) updates.status = status;
    if (canEditComment) updates.employeeComment = employeeComment.trim();
    if (canAssign) updates.assignedToUid = assignedToUid || null;

    try {
      await updateDoc(doc(db, "complaints", id), updates);
      setMessage("Changes saved successfully.");
    } catch (err) {
      setError("Permission denied or server error.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this complaint permanently?")) return;
    try {
      await deleteDoc(doc(db, "complaints", id));
      navigate("/pages/view-complaint", { replace: true });
    } catch (err) {
      setError("You do not have permission to delete this.");
    }
  };

  if (!complaint || !role) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={7}>
        <MainCard title={`Edit Complaint (${status})`}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}

            <TextField
              label="Company ID (Tenant)"
              value={companyId}
              disabled
              fullWidth
              variant="filled"
            />

            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!canEditFields}
              fullWidth
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEditFields}
              fullWidth
              multiline
              rows={5}
            />

            <Divider />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canEditStatus}
              >
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                <MenuItem value="RESOLVED">RESOLVED</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Employee Comment"
              value={employeeComment}
              onChange={(e) => setEmployeeComment(e.target.value)}
              disabled={!canEditComment}
              fullWidth
              multiline
              rows={3}
            />

            {canAssign && (
              <FormControl fullWidth>
                <InputLabel id="assign-label">Assign to employee</InputLabel>
                <Select
                  labelId="assign-label"
                  value={assignedToUid || ""}
                  label="Assign to employee"
                  onChange={(e) => setAssignedToUid(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.uid} value={e.uid}>
                      {e.firstName || e.email} {e.lastName || ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Back
              </Button>

              <Stack direction="row" spacing={1}>
                {canDelete && (
                  <Button color="error" variant="outlined" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
                <Button variant="contained" onClick={handleSave}>
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}