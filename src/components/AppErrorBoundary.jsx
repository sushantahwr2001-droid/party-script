import { Component } from "react";
import { Box, Button, Card, Typography } from "@mui/material";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unexpected error" };
  }

  componentDidCatch() {}

  reset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#07111f",
            p: 2,
          }}
        >
          <Card
            sx={{
              maxWidth: 420,
              p: 3,
              textAlign: "center",
            }}
          >
            <Typography fontSize={22} fontWeight={800}>
              Party Script hit an error
            </Typography>
            <Typography fontSize={13} color="text.secondary" mt={1}>
              {this.state.errorMessage}
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={this.reset}>
              Reload app
            </Button>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
