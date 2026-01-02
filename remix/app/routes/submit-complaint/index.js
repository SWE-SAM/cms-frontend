import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Grid, TextField, Button, Alert, Stack } from "@mui/material";
import MainCard from "ui-component/cards/MainCard";

import { useAuth } from "context/AuthContext";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "services/firebase.client";

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Remix client-side "guard"
  useEffect(() => {
    if (!loading && !user) {
      navigate("/pages/login/login3", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) return null;
  if (!user) return null; // while redirecting

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!subject.trim() || !description.trim()) {
      setErrorMsg("Please fill in both subject and description.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "complaints"), {
        subject: subject.trim(),
        description: description.trim(),
        status: "OPEN",
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
        createdByEmail: user.email
      });

      setSuccessMsg("Complaint submitted successfully.");
      setSubject("");
      setDescription("");
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Failed to submit complaint.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={7}>
        <MainCard title="Submit Complaint">
          <Stack spacing={2}>
            {successMsg && (
              <Alert severity="success" onClose={() => setSuccessMsg("")}>
                {successMsg}
              </Alert>
            )}

            {errorMsg && (
              <Alert severity="error" onClose={() => setErrorMsg("")}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Subject"
                margin="normal"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={saving}
              />

              <TextField
                fullWidth
                label="Description"
                margin="normal"
                multiline
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={saving}
              />

              <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={saving}>
                {saving ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
