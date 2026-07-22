import React from 'react';
import { Recipient } from './types';

export default function RecipientMatrix({ recipients, setRecipients }: { recipients: Recipient[], setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>> }) {
  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: `rec-${Date.now()}`,
      name: `Guest ${recipients.length + 1}`,
      household: 'Household A',
      salutation: 'Dear Guest',
      channel: 'email',
      consent: true,
      rsvp_state: 'pending'
    };
    setRecipients([...recipients, newRecipient]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
        <span className="font-medium">Personalization Matrix</span>
        <button onClick={addRecipient} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">+ Add Recipient</button>
      </div>
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-sm text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 bg-gray-100 shadow-sm">
            <tr>
              <th className="p-2 border-b border-gray-200">Name</th>
              <th className="p-2 border-b border-gray-200">Household</th>
              <th className="p-2 border-b border-gray-200">Variant Binding</th>
              <th className="p-2 border-b border-gray-200">Channel</th>
              <th className="p-2 border-b border-gray-200 text-center">RSVP</th>
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No recipients added. Use the button above to add deterministic fixtures.</td></tr>
            ) : (
              recipients.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-2 font-medium text-gray-800">{r.name}</td>
                  <td className="p-2 text-gray-600">{r.household}</td>
                  <td className="p-2">
                    <select className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white w-full">
                      <option value="">Default (Main)</option>
                      <option value="variant-a">Variant A (Family)</option>
                      <option value="variant-b">Variant B (Friends)</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-gray-200 text-gray-700">{r.channel}</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block w-20 text-center ${
                      r.rsvp_state === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                      r.rsvp_state === 'declined' ? 'bg-red-100 text-red-700 border border-red-200' :
                      'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {r.rsvp_state}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
