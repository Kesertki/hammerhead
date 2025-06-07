import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Connection {
	name: string;
	transport: 'stdio' | 'streamable http';
	command: string;
	args: string;
	env: string;
}

declare global {
	interface Window {
		electronAPI: {
			getMCPServers: () => Promise<Connection[]>;
			setMCPServers: (servers: Connection[]) => Promise<void>;
		};
	}
}

export default function MCPConnectionsPage() {
	const [connections, setConnections] = useState<Connection[]>([]);
	const [current, setCurrent] = useState<Connection | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	useEffect(() => {
		window.electronAPI.getMCPServers().then(setConnections);
	}, []);

	const saveToStore = (updated: Connection[]) => {
		window.electronAPI.setMCPServers(updated);
		setConnections(updated);
	};

	const handleAdd = () => {
		const validationErrors = validate(current);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}
		const updated = [...connections, current!];
		saveToStore(updated);
		setCurrent(null);
		setShowForm(false);
		setErrors({});
	};

	const handleUpdate = () => {
		const validationErrors = validate(current);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}
		const updated = connections.map((c) =>
			c.name === current!.name ? current! : c
		);
		saveToStore(updated);
		setCurrent(null);
		setShowForm(false);
		setErrors({});
	};

	const handleDelete = (name: string) => {
		const updated = connections.filter((c) => c.name !== name);
		saveToStore(updated);
	};

	const handleEdit = (conn: Connection) => {
		setCurrent(conn);
		setShowForm(true);
		setErrors({});
	};

	const validate = (conn: Connection | null) => {
		const errs: { [key: string]: string } = {};
		if (!conn?.name) errs.name = 'Name is required';
		if (!conn?.command) errs.command = 'Command is required';
		return errs;
	};

	const handleChange = (field: keyof Connection, value: string) => {
		if (!current) return;
		setCurrent({ ...current, [field]: value });
	};

	return (
		<div className="h-full overflow-y-auto p-6 space-y-6">
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>MCP Server Connections</CardTitle>
						<CardDescription>Manage your MCP server endpoints</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Transport</TableHead>
									<TableHead>Command</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{connections.map((conn) => (
									<TableRow key={conn.name}>
										<TableCell>{conn.name}</TableCell>
										<TableCell>{conn.transport}</TableCell>
										<TableCell>{conn.command}</TableCell>
										<TableCell className="space-x-2">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleEdit(conn)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(conn.name)}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
					<CardFooter>
						<Button
							onClick={() => {
								setCurrent({
									name: '',
									transport: 'stdio',
									command: '',
									args: '',
									env: ''
								});
								setShowForm(true);
								setErrors({});
							}}
						>
							Add New Connection
						</Button>
					</CardFooter>
				</Card>

				{showForm && (
					<Card>
						<CardHeader>
							<CardTitle>
								{current?.name ? 'Edit Connection' : 'New Connection'}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid w-full max-w-sm items-center gap-3">
								<Label>Name</Label>
								<Input
									value={current?.name || ''}
									onChange={(e) => handleChange('name', e.target.value)}
								/>
								{errors.name && (
									<p className="text-sm text-red-500">{errors.name}</p>
								)}
							</div>
							<div className="grid w-full max-w-sm items-center gap-3">
								<Label>Transport</Label>
								<select
									className="border rounded px-3 py-2"
									value={current?.transport}
									onChange={(e) => handleChange('transport', e.target.value)}
								>
									<option value="stdio">stdio</option>
									<option value="streamable http">streamable http</option>
								</select>
							</div>
							<div className="grid w-full max-w-sm items-center gap-3">
								<Label>Command</Label>
								<Input
									value={current?.command || ''}
									onChange={(e) => handleChange('command', e.target.value)}
								/>
								{errors.command && (
									<p className="text-sm text-red-500">{errors.command}</p>
								)}
							</div>
							<div className="grid w-full max-w-sm items-center gap-3">
								<Label>Arguments</Label>
								<Textarea
									value={current?.args || ''}
									onChange={(e) => handleChange('args', e.target.value)}
								/>
							</div>
							<div className="grid w-full max-w-sm items-center gap-3">
								<Label>Environment Variables</Label>
								<Textarea
									value={current?.env || ''}
									onChange={(e) => handleChange('env', e.target.value)}
								/>
							</div>
						</CardContent>
						<CardFooter className="space-x-2">
							{current && connections.some((c) => c.name === current.name) ? (
								<Button onClick={handleUpdate}>Update</Button>
							) : (
								<Button onClick={handleAdd}>Save</Button>
							)}
							<Button
								variant="ghost"
								onClick={() => {
									setCurrent(null);
									setShowForm(false);
									setErrors({});
								}}
							>
								Cancel
							</Button>
						</CardFooter>
					</Card>
				)}
			</div>
		</div>
	);
}
