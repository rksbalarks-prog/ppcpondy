import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import BottomNav from "./BottomNav";

const Home = () => <h1>Home</h1>;
const Profile = () => <h1>Profile</h1>;
const Notifications = () => <h1>Notifications</h1>;
const Messages = () => <h1>Messages</h1>;
const Settings = () => <h1>Settings</h1>;

const App = () => {
  return (
    <Router>
      <div>
        <Switch>
          <Route exact path="/home" component={Home} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/notifications" component={Notifications} />
          <Route exact path="/messages" component={Messages} />
          <Route exact path="/settings" component={Settings} />
        </Switch>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
