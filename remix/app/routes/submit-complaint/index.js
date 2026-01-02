import { useState } from "react";
import { Grid, TextField, Button, Alert, Stack } from "@mui/material";
import MainCard from "ui-component/cards/MainCard";

export default function SubmitComplaint() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);

    // UI-only for now: reset form to show it "worked"
    setSubject("");
    setDescription("");
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={7}>
        <MainCard title="Submit Complaint">
          <Stack spacing={2}>
            {success && (
              <Alert severity="success" onClose={() => setSuccess(false)}>
                Complaint submitted (demo). We’ll connect Firebase next.
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
              />

              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Submit
              </Button>
            </form>
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
