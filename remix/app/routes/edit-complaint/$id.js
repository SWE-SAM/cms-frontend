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

  const [role, setRole] = useState(null); // "user" | "admin" | "manager" | "employee" later
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
          <MainCard title="Edit Complaint">
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={18} />
              <Typography>Loading…</Typography>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    );
  }

  // permissions:
  // - admin can edit anything
  // - user can only edit their own complaint (and only subject/description)
  const isOwner = complaint?.createdByUid && user?.uid === complaint.createdByUid;
  const canEditAll = role === "admin";
  const canEditUserFields = canEditAll || isOwner;

  const handleSave = async () => {
    setErr("");
    setOk("");

    if (!complaint) return;

    if (!canEditUserFields) {
      setErr("You don’t have permission to edit this complaint.");
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setErr("Subject and description are required.");
      return;
    }

    try {
      setSaving(true);

      const updates = {
        subject: subject.trim(),
        description: description.trim(),
        updatedAt: serverTimestamp()
      };

      // only admins can change status/assignment (for now)
      if (canEditAll) {
        updates.status = status;
        updates.assignedToUid = assignedToUid || null;
      }

      await updateDoc(doc(db, "complaints", complaint.id), updates);

      setOk("Saved.");
      // optionally go back
      // navigate("/pages/view-complaint", { replace: true });
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
        <MainCard title="Edit Complaint">
          <Stack spacing={2}>
            {err && <Alert severity="error">{err}</Alert>}
            {ok && <Alert severity="success" onClose={() => setOk("")}>{ok}</Alert>}

            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={saving || !canEditUserFields}
              fullWidth
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving || !canEditUserFields}
              fullWidth
              multiline
              rows={6}
            />

            {/* Admin-only controls */}
            {canEditAll && (
              <>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="OPEN">OPEN</MenuItem>
                    <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                    <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Assigned To UID (manager feature later)"
                  value={assignedToUid}
                  onChange={(e) => setAssignedToUid(e.target.value)}
                  disabled={saving}
                  fullWidth
                  helperText="For now, paste an employee UID. We’ll replace this with a dropdown later."
                />
              </>
            )}

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={saving}>
                Back
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving || !canEditUserFields}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
