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
  Typography
} from "@mui/material";

import MainCard from "ui-component/cards/MainCard";

import { useAuth } from "context/AuthContext";
import { db } from "services/firebase.client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export default function EditComplaintPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // from /edit-complaint/:id
  const { user, loading } = useAuth();

  const [role, setRole] = useState(null); // "user" | "admin" | "manager" | "employee"
  const [complaint, setComplaint] = useState(null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("OPEN");

  // for later (manager assigning to employee)
  const [assignedToUid, setAssignedToUid] = useState("");

  const [saving, setSaving] = useState(false);
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
          if (!cancelled) setErr("Complaint not found.");
          return;
        }

        const data = { id: snap.id, ...snap.data() };

        if (!cancelled) {
          setComplaint(data);
          setSubject(data.subject || "");
          setDescription(data.description || "");
          setStatus((data.status || "OPEN").toUpperCase());
          setAssignedToUid(data.assignedToUid || "");
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

  if (err) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={7}>
          <MainCard title="Complaint">
            <Alert severity="error">{err}</Alert>
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

  // ---------- PERMISSIONS ----------
  const isOwner = complaint?.createdByUid && user?.uid === complaint.createdByUid;
  const isAdminOrManager = role === "admin" || role === "manager";
  const isEmployee = role === "employee";
  const isAssignedEmployee = isEmployee && complaint?.assignedToUid === user?.uid;

  // who can view this complaint at all?
  const canView = isAdminOrManager || isOwner || isAssignedEmployee;

  // what can they edit?
  const canEditDetails = isAdminOrManager || isOwner;         // subject/description
  const canEditStatus = isAdminOrManager || isAssignedEmployee; // status
  const canEditAssignment = isAdminOrManager;                 // assignedToUid (later)

  if (!canView) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={7}>
          <MainCard title="Complaint">
            <Alert severity="error">You don’t have permission to view this complaint.</Alert>
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

    // if they can edit details, enforce required fields
    if (canEditDetails) {
      if (!subject.trim() || !description.trim()) {
        setErr("Subject and description are required.");
        return;
      }
    }

    // if they can’t edit anything, stop
    if (!canEditDetails && !canEditStatus && !canEditAssignment) {
      setErr("You don’t have permission to edit this complaint.");
      return;
    }

    try {
      setSaving(true);

      const updates = {
        updatedAt: serverTimestamp()
      };

      // details (owner or admin/manager)
      if (canEditDetails) {
        updates.subject = subject.trim();
        updates.description = description.trim();
      }

      // status (admin/manager OR assigned employee)
      if (canEditStatus) {
        updates.status = status;
      }

      // assignment (admin/manager only — you said later, so keep UI hidden for now)
      if (canEditAssignment) {
        updates.assignedToUid = assignedToUid || null;
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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={7}>
        <MainCard title="Complaint">
          <Stack spacing={2}>
            {ok && (
              <Alert severity="success" onClose={() => setOk("")}>
                {ok}
              </Alert>
            )}
            {err && <Alert severity="error">{err}</Alert>}

            {/* Helpful role hint (optional) */}
            {!canEditDetails && canEditStatus && (
              <Alert severity="info">
                You’re assigned to this complaint. You can update the status only.
              </Alert>
            )}
            {!canEditDetails && !canEditStatus && (
              <Alert severity="info">Read-only view.</Alert>
            )}

            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={saving || !canEditDetails}
              fullWidth
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving || !canEditDetails}
              fullWidth
              multiline
              rows={6}
            />

            {/* Status control: admin/manager OR assigned employee */}
            {canEditStatus && (
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={saving || !canEditStatus}
                >
                  <MenuItem value="OPEN">OPEN</MenuItem>
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Assignment UI: you said "next stage", so keep it hidden for now.
                If you still want it visible for admin/manager now, wrap this in {canEditAssignment && (...)} */}
            {false && canEditAssignment && (
              <TextField
                label="Assigned To UID (manager feature later)"
                value={assignedToUid}
                onChange={(e) => setAssignedToUid(e.target.value)}
                disabled={saving}
                fullWidth
              />
            )}

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={saving}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || (!canEditDetails && !canEditStatus && !canEditAssignment)}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
