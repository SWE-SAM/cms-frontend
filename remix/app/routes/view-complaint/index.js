import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@remix-run/react";

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography
} from "@mui/material";

import MainCard from "ui-component/cards/MainCard";

import { useAuth } from "context/AuthContext";
import { db } from "services/firebase.client";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where
} from "firebase/firestore";

export default function ViewComplaintPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [role, setRole] = useState(null); // "user" | "admin"
  const [complaints, setComplaints] = useState([]);
  const [err, setErr] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/pages/login/login3", { replace: true });
    }
  }, [loading, user, navigate]);

  // Load role from users/{uid}
  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : null;

        if (!cancelled) {
          setRole(data?.role || "user");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr(e?.message || "Failed to load user role.");
          setRole("user"); // safe fallback
        }
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Build query based on role
  const complaintsQuery = useMemo(() => {
    if (!user || !role) return null;

    const base = collection(db, "complaints");

    // Admin: see everything
    if (role === "admin") {
      return query(base, orderBy("createdAt", "desc"));
    }

    // Normal user: only their own
    return query(
      base,
      where("createdByUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [user, role]);

  // Subscribe
  useEffect(() => {
    if (!complaintsQuery) return;

    const unsub = onSnapshot(
      complaintsQuery,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setComplaints(rows);
      },
      (e) => {
        console.error(e);
        setErr(e?.message || "Failed to load complaints.");
      }
    );

    return () => unsub();
  }, [complaintsQuery]);

  if (loading) return null;
  if (!user) return null; // while redirecting

  if (!role) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MainCard title="View Complaints">
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={18} />
              <Typography>Loading complaints…</Typography>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title={`View Complaints (${role})`}>
          <Stack spacing={2}>
            {err && <Alert severity="error">{err}</Alert>}

            {!err && complaints.length === 0 && (
              <Alert severity="info">No complaints found.</Alert>
            )}

            {complaints.map((c) => {
              const status = (c.status || "OPEN").toUpperCase();

              return (
                <Box
                  key={c.id}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                  >
                    <Typography variant="h5">
                      {c.subject || "(No subject)"}
                    </Typography>

                    <Chip
                      label={status}
                      size="small"
                      color={
                        status === "OPEN"
                          ? "warning"
                          : status === "IN_PROGRESS"
                          ? "info"
                          : "success"
                      }
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                  >
                    {c.description || ""}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                  >
                    <Typography variant="caption">
                      By: {c.createdByEmail || "unknown"}
                    </Typography>

                    <Typography variant="caption">
                      {c.createdAt?.toDate
                        ? c.createdAt.toDate().toLocaleString()
                        : ""}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
