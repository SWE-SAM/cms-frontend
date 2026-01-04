import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@remix-run/react";

import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Divider,
} from "@mui/material";

import MainCard from "ui-component/cards/MainCard";

import { useAuth } from "context/AuthContext";
import { db } from "services/firebase.client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export default function EditComplaintPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // /edit-complaint/:id
  const { user, loading } = useAuth();

  const [role, setRole] = useState(null); // "user" | "admin" | "manager" | "employee"
  const [complaint, setComplaint] = useState(null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("OPEN");

  const [assignedToUid, setAssignedToUid] = useState("");
  const [employees, setEmployees] = useState([]); // [{ uid, firstName, lastName, email }]

  // ✅ NEW: employee comment field
  const [employeeComment, setEmployeeComment] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate("/pages/login/login3", { replace: true });
  }, [loading, user, navigate]);

  // load role
  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : null;
        if (!cancelled) setRole(data?.role || "user");
      } catch (e) {
        console.error(e);
        if (!cancelled) setRole("user");
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // load complaint
  useEffect(() => {
    let cancelled = false;

    async function loadComplaint() {
      if (!user || !id) return;

      try {
        const snap = await getDoc(doc(db, "complaints", id));
        if (!snap.exists()) {
          setErr("Complaint not found.");
          return;
        }

        const data = { id: snap.id, ...snap.data() };

        if (!cancelled) {
          setComplaint(data);
          setSubject(data.subject || "");
          setDescription(data.description || "");
          setStatus((data.status || "OPEN").toUpperCase());
          setAssignedToUid(data.assignedToUid || "");

          // ✅ NEW
          setEmployeeComment(data.employeeComment || "");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e?.message || "Failed to load complaint.");
      }
    }

    loadComplaint();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  const isAdminOrManager = role === "admin" || role === "manager";
  const isEmployee = role === "employee";
  const isOwner = complaint?.createdByUid && user?.uid === complaint.createdByUid;
  const isAssignedEmployee = isEmployee && complaint?.assignedToUid === user?.uid;

  // UI permissions aligned with your rules + intent:
  // - Admin/Manager: edit everything + assign + delete
  // - Owner (user): edit subject/description; delete (allowed by rules)
  // - Employee assigned: can only edit status + employeeComment
  const canEditUserFields = isAdminOrManager || isOwner;
  const canEditStatus = isAdminOrManager || isAssignedEmployee;
  const canAssign = isAdminOrManager;
  const canDelete = isAdminOrManager || isOwner;

  // ✅ NEW: comment permission
  const canEditEmployeeComment = isAdminOrManager || isAssignedEmployee;

  // Load employees list for assign dropdown (admin/manager only)
  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      if (!user || !role || !canAssign) return;

      try {
        const q = query(collection(db, "users"), where("role", "==", "employee"));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
          };
        });

        if (!cancelled) setEmployees(rows);
      } catch (e) {
        console.error(e);
      }
    }

    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, [user, role, canAssign]);

  if (loading) return null;
  if (!user) return null;

  if (!role || (!complaint && !err)) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={7}>
          <MainCard title="Complaint">
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={18} />
              <Typography>Loading…</Typography>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    );
  }

  if (complaint && isEmployee && !isAssignedEmployee) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={7}>
          <MainCard title="Complaint">
            <Alert severity="error">
              You don’t have permission to view this complaint.
            </Alert>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Back
              </Button>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    );
  }

  const handleSave = async () => {
    setErr("");
    setOk("");
    if (!complaint) return;

    if (!canEditUserFields && !canEditStatus && !canAssign && !canEditEmployeeComment) {
      setErr("You don’t have permission to edit this complaint.");
      return;
    }

    if (canEditUserFields) {
      if (!subject.trim() || !description.trim()) {
        setErr("Subject and description are required.");
        return;
      }
    }

    try {
      setSaving(true);

      const updates = {
        updatedAt: serverTimestamp(),
      };

      if (canEditUserFields) {
        updates.subject = subject.trim();
        updates.description = description.trim();
      }

      if (canEditStatus) {
        updates.status = status;
      }

      // ✅ NEW: employee comment
      if (canEditEmployeeComment) {
        updates.employeeComment = employeeComment.trim();
      }

      if (canAssign) {
        const uid = assignedToUid || null;
        updates.assignedToUid = uid;

        if (!uid) {
          updates.assignedToEmail = null;
          updates.assignedToName = null;
        } else {
          const emp = employees.find((e) => e.uid === uid);
          updates.assignedToEmail = emp?.email || null;
          const name = `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim();
          updates.assignedToName = name || null;
        }
      }

      await updateDoc(doc(db, "complaints", complaint.id), updates);
      setOk("Saved.");
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setErr("");
    setOk("");
    if (!complaint) return;

    if (!canDelete) {
      setErr("You don’t have permission to delete this complaint.");
      return;
    }

    const ok = window.confirm(
      "Delete this complaint permanently? This cannot be undone."
    );
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, "complaints", complaint.id));
      navigate("/pages/view-complaint", { replace: true });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to delete complaint.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={7}>
        <MainCard title="Complaint">
          <Stack spacing={2}>
            {err && <Alert severity="error">{err}</Alert>}
            {ok && (
              <Alert severity="success" onClose={() => setOk("")}>
                {ok}
              </Alert>
            )}

            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={saving || deleting || !canEditUserFields}
              fullWidth
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving || deleting || !canEditUserFields}
              fullWidth
              multiline
              rows={6}
            />

            <Divider />

            {/* Status: admin/manager OR assigned employee */}
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving || deleting || !canEditStatus}
              >
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                <MenuItem value="RESOLVED">RESOLVED</MenuItem>
              </Select>
            </FormControl>

            {/* ✅ NEW: employee comments */}
            <TextField
              label="Employee Comment"
              value={employeeComment}
              onChange={(e) => setEmployeeComment(e.target.value)}
              disabled={saving || deleting || !canEditEmployeeComment}
              fullWidth
              multiline
              rows={3}
              helperText={
                canEditEmployeeComment
                  ? "Employees can add notes here. Admin/Manager can also edit."
                  : "Only the assigned employee (or admin/manager) can edit this."
              }
            />

            {/* Assignment: admin/manager only */}
            {canAssign && (
              <FormControl fullWidth>
                <InputLabel id="assign-label">Assign to employee</InputLabel>
                <Select
                  labelId="assign-label"
                  label="Assign to employee"
                  value={assignedToUid}
                  onChange={(e) => setAssignedToUid(e.target.value)}
                  disabled={saving || deleting}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.uid} value={e.uid}>
                      {`${(e.firstName || "").trim()} ${(e.lastName || "").trim()}`.trim() ||
                        e.email ||
                        e.uid}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={saving || deleting}
              >
                Back
              </Button>

              <Stack direction="row" spacing={1}>
                {canDelete && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDelete}
                    disabled={saving || deleting}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                )}

                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    deleting ||
                    (!canEditUserFields && !canEditStatus && !canAssign && !canEditEmployeeComment)
                  }
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
