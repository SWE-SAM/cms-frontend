import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";

import {
  Grid,
  TextField,
  Button,
  Alert,
  Stack
} from "@mui/material";

import MainCard from "ui-component/cards/MainCard";
import { useAuth } from "context/AuthContext";

import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "services/firebase.client";

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      navigate("/pages/login/login3", { replace: true });
    }
  }, [loading, user, navigate]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!subject.trim() || !description.trim()) {
      setError("Subject and description are required.");
      return;
    }

    try {
      // 1. Fetch the user's profile to get their companyId
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      let userCompanyId = "";
      if (userSnap.exists()) {
        userCompanyId = userSnap.data().companyId || "";
      }

      // 2. Add the complaint with the companyId field
      await addDoc(collection(db, "complaints"), {
        subject: subject.trim(),
        description: description.trim(),
        status: "OPEN",
        companyId: userCompanyId, // CRITICAL: This links the complaint to the company
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdByUid: user.uid,
        createdByEmail: user.email
      });

      setMessage("Complaint submitted successfully.");
      setSubject("");
      setDescription("");
    } catch (e) {
      console.error(e);
      setError("Failed to submit complaint. Check console for details.");
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={7}>
        <MainCard title="Submit Complaint">
          <Stack spacing={2}>
            {message && (
              <Alert severity="success" onClose={() => setMessage("")}>
                {message}
              </Alert>
            )}

            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
                required
                margin="normal"
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={5}
                required
                margin="normal"
              />

              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Submit
              </Button>
            </form>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}