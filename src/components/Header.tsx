import SettingsIcon from "@mui/icons-material/Settings";
import { Link } from "react-router-dom";
import { IconButton } from "@mui/material";

<IconButton
  color="inherit"
  component={Link}
  to="/settings"
  aria-label="settings"
>
  <SettingsIcon />
</IconButton>;
