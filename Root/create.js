/**
 * Copyright Â 2007 Jason Kridner
 *
 * @author Jason Kridner
 */

function create_action ()
 {
  if (req.data.submit)
   {
    var p = new Person();
    p.firstname = req.data.firstname;
    p.lastname = req.data.lastname;
    p.email = req.data.email;
    p.createtime = new Date();
    p.modifytime = new Date();
    root.add(p);
    res.redirect(root.href());
   }

  res.data.title = "Create Helma Address Book Entry";
  res.data.body = this.renderSkinAsString("edit");
  res.data.action = "create";
  renderSkin("index");
 }

