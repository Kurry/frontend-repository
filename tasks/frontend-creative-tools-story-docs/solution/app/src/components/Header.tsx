import React from 'react';
import { Menu, Bell, LayoutDashboard, User } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="font-bold text-lg flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-400 rounded-sm"></div>
          Demo Projects
        </div>
        <span className="text-gray-400">/</span>
        <h1 className="font-semibold text-lg">1. Getting Started</h1>

        <div className="dropdown dropdown-bottom dropdown-end">
          <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle inert-nav" aria-label="Project options">
            <Menu className="w-4 h-4" />
          </button>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><a className="inert-nav" href="#edit">Edit</a></li>
            <li><a className="inert-nav" href="#duplicate">Duplicate</a></li>
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-circle btn-sm inert-nav" aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </button>
        <button className="btn btn-ghost btn-circle btn-sm inert-nav" aria-label="Dashboard">
          <LayoutDashboard className="w-5 h-5" />
        </button>

        <div className="dropdown dropdown-bottom dropdown-end ml-2">
          <button tabIndex={0} className="btn btn-ghost btn-circle avatar" aria-label="Account drawer">
            <div className="w-8 rounded-full bg-yellow-200 flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-800 m-auto mt-1.5" />
            </div>
          </button>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><button className="inert-nav">Profile</button></li>
            <li><button className="inert-nav">Settings</button></li>
          </ul>
        </div>
      </div>
    </header>
  );
}
