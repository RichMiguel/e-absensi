export function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  req.flash("error", "Login Terlebih Dahulu!");
  return res.redirect("/auth/login");
}

export default isAuthenticated;