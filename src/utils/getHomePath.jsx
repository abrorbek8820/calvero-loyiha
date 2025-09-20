export function getHomePath() {
  const pkg = window.APP_PACKAGE_NAME || "";

  if (pkg === "com.calvero.calvero") {
    return "/home";   // Google Play ilova
  } else if (pkg === "com.calvero.calveroworker") {
    return "/home-worker";  // Worker ilova
  } else {
    return "/";       // Oddiy brauzer
  }
}