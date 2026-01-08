import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@remix-run/react";

import {
  Alert,
  Box,
  Button,
  Chip,
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

  const [role, setRole] = useState("");
  const [companyId, setCompanyId] = useState(""); 
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/pages/login/login3", { replace: true });
    }
  }, [loading, user, navigate]);

  // Load user role and company context
  useEffect(() => {
    if (!user) return;

    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "user");
          setCompanyId(data.companyId || ""); // multi-tenancy
        } else {
          setRole("user");
        }
      })
      .catch(() => {
        setError("Failed to load user role.");
        setRole("user");
      });
  }, [user]);

  // Build query based on role
  const complaintsQuery = useMemo(() => {
    if (!user || !role) return null;

    const base = collection(db, "complaints");

    // Global Admin/Manager: sees all complaints
    if (role === "admin" || role === "manager") {
      return query(base, orderBy("createdAt", "desc"));
    }

    // Company Manager: restricted to their own companyId
    if (role === "companyManager") {
      if (!companyId) return null; 
      return query(
        base,
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      );
    }

    // Employee: restricted to assigned complaints
    if (role === "employee") {
      return query(
        base,
        where("assignedToUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

    // Consumer: restricted to their own submissions
    return query(
      base,
      where("createdByUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [user, role, companyId]); 

  // Subscribe to complaints
  useEffect(() => {
    if (!complaintsQuery) return;

    return onSnapshot(
      complaintsQuery,
      (snap) => {
        setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error(err);
        setError("Failed to load complaints. Ensure Firestore indexes are created.");
      }
    );
  }, [complaintsQuery]);

  if (!user) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title={`View Complaints (${role || "user"})`}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            {complaints.length === 0 && !error && (
              <Alert severity="info">No complaints found for your account.</Alert>
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
                  >
                    <Typography variant="h6">
                      {c.subject || "(No subject)"}
                    </Typography>

                    <Stack direction="row" spacing={1}>
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

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          navigate(`/edit-complaint/${c.id}`)
                        }
                      >
                        View
                      </Button>
                    </Stack>
                  </Stack>

                  <Typography sx={{ mt: 1 }}>
                    {c.description || ""}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Stack>
                      <Typography variant="caption" display="block">
                        By: {c.createdByEmail || "unknown"}
                      </Typography>
                      {/* Show company identifier for managers */}
                      {(role === "admin" || role === "manager") && (
                        <Typography variant="caption" color="primary">
                          Tenant: {c.companyId || "N/A"}
                        </Typography>
                      )}
                    </Stack>

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