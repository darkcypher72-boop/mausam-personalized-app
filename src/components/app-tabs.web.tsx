import React from "react";
import { Tabs, TabList, TabTrigger } from "expo-router/ui";

export default function AppTabsWeb() {
  return (
    <Tabs>
      <TabList>
        <TabTrigger name="home" href="/home" asChild>
          <TabTrigger name="home" href="/home">
            Home
          </TabTrigger>
        </TabTrigger>

        <TabTrigger name="profile" href="/profile" asChild>
          <TabTrigger name="profile" href="/profile">
            Profile
          </TabTrigger>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
