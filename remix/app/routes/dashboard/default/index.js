import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";

// MUI
import { Grid, Typography, Button, Alert } from "@mui/material";

// Project
import MainCard from "ui-component/cards/MainCard";
import { useAuth } from "context/AuthContext";
import { db } from "services/firebase.client";

// Firestore
import {
  collection,
  doc,
  getDoc,
  getCountFromServer,
  query,
  where
} from "firebase/firestore";

// Page metadata
export const meta = () => ({
  title: "Complaint Management System",
  description: "Dashboard"
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // role: user | employee | manager | admin | companyManager
  const [role, setRole] = useState(null);
  const [companyId, setCompanyId] = useState(""); 

  // simple stats object
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/pages/login/login3", { replace: true });
    }
  }, [loading, user, navigate]);

  // Load the user role and companyId from Firestore
  useEffect(() => {
    if (!user) return;

    async function loadRole() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "user");
          setCompanyId(data.companyId || ""); // Capture the companyId
        } else {
          setRole("user");
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load user role");
      }
    }

    loadRole();
  }, [user]);

  // Load complaint counts based on role
  useEffect(() => {
    if (!user || !role) return;

    async function loadStats() {
      try {
        const complaintsRef = collection(db, "complaints");

        // Decide which complaints this user is allowed to see
        let baseQuery;

        if (role === "admin" || role === "manager") {
          baseQuery = query(complaintsRef);
        } else if (role === "companyManager") {
          // Filter by companyId for the companyManager role
          baseQuery = query(
            complaintsRef,
            where("companyId", "==", companyId)
          );
        } else if (role === "employee") {
          baseQuery = query(
            complaintsRef,
            where("assignedToUid", "==", user.uid)
          );
        } else {
          baseQuery = query(
            complaintsRef,
            where("createdByUid", "==", user.uid)
          );
        }

        // Count totals by status
        
        const [totalSnap, openSnap, inProgressSnap, resolvedSnap] = await Promise.all([
          getCountFromServer(baseQuery),
          getCountFromServer(query(baseQuery, where("status", "==", "OPEN"))),
          getCountFromServer(query(baseQuery, where("status", "==", "IN_PROGRESS"))),
          getCountFromServer(query(baseQuery, where("status", "==", "RESOLVED")))
        ]);

        setStats({
          total: totalSnap.data().count,
          open: openSnap.data().count,
          inProgress: inProgressSnap.data().count,
          resolved: resolvedSnap.data().count
        });
      } catch (e) {
        console.error(e);
        setError("Failed to load dashboard data. Check your Firestore indexes.");
      }
    }

    loadStats();
  }, [user, role, companyId]); 

  if (!user || !role) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="Dashboard">
          <Typography variant="body1">
            Logged in as: <strong>{role}</strong> {companyId && `(${companyId})`}
          </Typography>
        </MainCard>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      {/* Stats */}
      <Grid item xs={12} md={3}>
        <MainCard>
          <Typography variant="h6">Total complaints</Typography>
          <Typography variant="h3">{stats.total}</Typography>
        </MainCard>
      </Grid>

      <Grid item xs={12} md={3}>
        <MainCard>
          <Typography variant="h6">Open</Typography>
          <Typography variant="h3">{stats.open}</Typography>
        </MainCard>
      </Grid>

      <Grid item xs={12} md={3}>
        <MainCard>
          <Typography variant="h6">In progress</Typography>
          <Typography variant="h3">{stats.inProgress}</Typography>
        </MainCard>
      </Grid>

      <Grid item xs={12} md={3}>
        <MainCard>
          <Typography variant="h6">Resolved</Typography>
          <Typography variant="h3">{stats.resolved}</Typography>
        </MainCard>
      </Grid>

      {/* Quick actions */}
      <Grid item xs={12}>
        <MainCard title="Actions">
          <Button
            variant="contained"
            sx={{ mr: 1 }}
            onClick={() => navigate("/submit-complaint")}
          >
            Submit complaint
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate("/pages/view-complaint")}
          >
            View complaints
          </Button>
        </MainCard>
      </Grid>
    </Grid>
  );
}