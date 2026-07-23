import re

with open('/tmp/App.jsx', 'r') as f:
    content = f.read()

# 1. Update initialStations to fix layout overlap
content = content.replace(
    "{ id: 's3', name: 'Dessert Station', bounds: { w: 100, h: 60 } }",
    "{ id: 's3', name: 'Dessert Station', bounds: { w: 100, h: 60 }, x: 50, y: 150 }"
)
content = content.replace(
    "{ id: 's4', name: 'Drink Station', bounds: { w: 100, h: 60 } }",
    "{ id: 's4', name: 'Drink Station', bounds: { w: 100, h: 60 }, x: 200, y: 150 }"
)
content = content.replace(
    "{ id: 's1', name: 'Hot Station', bounds: { w: 200, h: 60 } }",
    "{ id: 's1', name: 'Hot Station', bounds: { w: 200, h: 60 }, x: 50, y: 50 }"
)
content = content.replace(
    "{ id: 's2', name: 'Cold Station', bounds: { w: 200, h: 60 } }",
    "{ id: 's2', name: 'Cold Station', bounds: { w: 200, h: 60 }, x: 300, y: 50 }"
)

# And update the render block for stations
old_station_render = """<div class="absolute border-2 border-indigo-300 bg-indigo-50 p-2 text-indigo-800 text-sm opacity-50"
                                     style={{ width: `${station.bounds.w}px`, height: `${station.bounds.h}px`,
                                     left: `${station.id === 's1' ? 50 : station.id === 's2' ? 300 : 50}px`,
                                     top: `${station.id === 's1' ? 50 : station.id === 's2' ? 50 : 200}px` }}>"""

new_station_render = """<div class="absolute border-2 border-indigo-300 bg-indigo-50 p-2 text-indigo-800 text-sm opacity-50"
                                     style={{ width: `${station.bounds.w}px`, height: `${station.bounds.h}px`,
                                     left: `${station.x}px`,
                                     top: `${station.y}px` }}>"""
content = content.replace(old_station_render, new_station_render)


# 2. Add centimeter grid background to Buffet Canvas
old_canvas = '<div class="relative w-full h-[500px] border-2 border-dashed border-gray-300 bg-gray-100 overflow-hidden">'
new_canvas = '<div class="relative w-full h-[500px] border-2 border-dashed border-gray-300 bg-gray-100 overflow-hidden" style="background-size: 20px 20px; background-image: linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px);">'
content = content.replace(old_canvas, new_canvas)

# 3. Add transition and hover classes
content = content.replace(
    'class="border p-4 rounded shadow-sm hover:shadow-md transition"',
    'class="border p-4 rounded shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"'
)
content = content.replace(
    'class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded"',
    'class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"'
)
content = content.replace(
    'class="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 min-h-[44px] rounded border border-white"',
    'class="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 min-h-[44px] rounded border border-white transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"'
)
content = content.replace(
    'class="bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded hover:bg-blue-700"',
    'class="bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded hover:bg-blue-700 transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"'
)


with open('/tmp/App.jsx', 'w') as f:
    f.write(content)
