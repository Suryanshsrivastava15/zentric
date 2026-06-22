"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Key,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  Palette,
  Info,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface SettingsData {
  settings: {
    theme: string;
    openaiApiKey?: string | null;
    displayName?: string | null;
    bio?: string | null;
    leetcodeUsername?: string | null;
  };
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    bio: "",
    openaiApiKey: "",
    theme: "dark",
    leetcodeUsername: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setForm({
          name: d.user?.name || "",
          displayName: d.settings?.displayName || "",
          bio: d.settings?.bio || "",
          openaiApiKey: d.settings?.openaiApiKey || "",
          theme: d.settings?.theme || "dark",
          leetcodeUsername: d.settings?.leetcodeUsername || "",
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    await updateSession();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const name = form.name || (session?.user?.email ?? "") || "U";
              const initial = String(name).charAt(0).toUpperCase();
              return (
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {initial}
              </div>
              <div>
                <p className="text-white font-medium">{form.name || "Your Name"}</p>
                <p className="text-gray-500 text-sm">{session?.user?.email}</p>
                <Badge variant="secondary" className="mt-1 text-xs">Free Plan</Badge>
              </div>
            </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Username</Label>
                <Input
                  id="displayName"
                  placeholder="@username"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={session?.user?.email || ""}
                disabled
                className="opacity-50"
              />
              <p className="text-xs text-gray-600">Email cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              API Configuration
            </CardTitle>
            <CardDescription>Configure external API integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300">
                <strong>OpenAI API Key</strong> — Required for AI Chat features. Get your key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  platform.openai.com
                </a>
                . Your key is stored securely and only used for your requests.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openaiKey">OpenAI API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="openaiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={form.openaiApiKey}
                  onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                  className="pl-10 pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LeetCode Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-orange-400" />
              LeetCode Integration
            </CardTitle>
            <CardDescription>Connect your public LeetCode profile to track progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-300">
                Enter your LeetCode username to track solved problems, stats, and recent submissions. Your profile must be <strong>public</strong> on LeetCode.
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leetcodeUsername">LeetCode Username</Label>
              <div className="relative">
                <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="leetcodeUsername"
                  placeholder="e.g. suryansh15"
                  value={form.leetcodeUsername}
                  onChange={(e) => setForm({ ...form, leetcodeUsername: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              Appearance
            </CardTitle>
            <CardDescription>Customize your interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-3">
                {["dark", "darker", "midnight"].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setForm({ ...form, theme })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                      form.theme === theme
                        ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                        : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        theme === "dark"
                          ? "bg-gray-700"
                          : theme === "darker"
                          ? "bg-gray-900"
                          : "bg-black"
                      }`}
                    />
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Settings saved successfully!
            </div>
          )}
          <div className="ml-auto">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
