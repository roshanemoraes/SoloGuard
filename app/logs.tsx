import { Redirect } from "expo-router";

// Redirect root /logs to the tabs logs route to satisfy navigation lookup
export default function LogsRedirect() {
  return <Redirect href="/(tabs)/logs" />;
}
