// This action adds custom flags to Page objects that can be used
// to trigger additional behaviors, such as other skins for rendering.
function set_action ()
 {
  if (!session.user || !session.user["name"])
   res.redirect(this.href());
  this.user = session.user["name"];
  if (req.data["render_skin"])
   this.render_skin = req.data["render_skin"];
  if (req.data["edit_skin"])
   this.edit_skin = req.data["edit_skin"];
  if (req.data["list_children"])
   if (req.data["list_children"] == "delete")
    delete this.list_children;
   else
    this.list_children = req.data["list_children"];
  if (req.data["registrant"])
   this.registrant = req.data["registrant"];
  res.redirect(this.href());
 }
