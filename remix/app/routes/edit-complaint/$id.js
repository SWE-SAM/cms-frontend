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

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/pages/login/login3", { replace: true });
    }
  }, [loading, user, navigate]);

  if (!user) return null;

  // Load role
  useEffect(() => {
    async function loadRole() {
      const snap = await getDoc(doc(db, "users", user.uid));
      setRole(snap.exists() ? snap.data().role : "user");
    }
    loadRole();
  }, [user]);

  // Load complaint
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

  const isAdminOrManager = role === "admin" || role === "manager";
  const isEmployee = role === "employee";
  const isOwner = complaint?.createdByUid === user.uid;
  const isAssignedEmployee = isEmployee && complaint?.assignedToUid === user.uid;

  const canEditFields = isAdminOrManager || isOwner;
  const canEditStatus = isAdminOrManager || isAssignedEmployee;
  const canEditComment = isAdminOrManager || isAssignedEmployee;
  const canAssign = isAdminOrManager;
  const canDelete = isAdminOrManager || isOwner;

  // Load employees (for assignment)
  useEffect(() => {
    if (!canAssign) return;

    async function loadEmployees() {
      const q = query(collection(db, "users"), where("role", "==", "employee"));
      const snap = await getDocs(q);
      setEmployees(
        snap.docs.map((d) => ({
          uid: d.id,
          ...d.data()
        }))
      );
    }

    loadEmployees();
  }, [canAssign]);

  const handleSave = async () => {
    setError("");
    setMessage("");

    if (canEditFields && (!subject.trim() || !description.trim())) {
      setError("Subject and description are required.");
      return;
    }

    const updates = {
      updatedAt: serverTimestamp()
    };

    if (canEditFields) {
      updates.subject = subject.trim();
      updates.description = description.trim();
    }

    if (canEditStatus) {
      updates.status = status;
    }

    if (canEditComment) {
      updates.employeeComment = employeeComment.trim();
    }

    if (canAssign) {
      updates.assignedToUid = assignedToUid || null;
    }

    await updateDoc(doc(db, "complaints", id), updates);
    setMessage("Changes saved.");
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this complaint permanently?")) return;
    await deleteDoc(doc(db, "complaints", id));
    navigate("/pages/view-complaint", { replace: true });
  };

  if (!complaint || !role) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={7}>
        <MainCard title="Complaint">
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}

            <TextField
              label="Company ID"
              value={companyId}
              disabled // Always disabled as this shouldn't be edited manually
              fullWidth
              variant="filled" // Optional: gives it a distinct "read-only" look
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
                <InputLabel>Assign to employee</InputLabel>
                <Select
                  value={assignedToUid}
                  label="Assign to employee"
                  onChange={(e) => setAssignedToUid(e.target.value)}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.uid} value={e.uid}>
                      {e.firstName} {e.lastName}
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
                  Save
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
