//STARTING PAGE

import { redirect } from "@remix-run/node";

export const loader = async () => {
  return redirect("/pages/login/login3");
};

export default function Index() {
  return null;
}
