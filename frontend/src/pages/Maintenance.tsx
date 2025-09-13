import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';

interface SlideshowImage {
  id: number;
  file_path: string;
  caption?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface ProposedChange {
  id: number;
  change_type: 'slideshow_image' | 'robot' | 'robot_delete' | 'sponsor' | 'sponsor_delete' | 'resource' | 'resource_delete' | 'resource_category' | 'resource_category_delete' | 'subteam_create' | 'subteam_update' | 'subteam_delete';
  proposed_data: any;
  user_id: string;
  proposed_by_name: string;
  status: 'pending' | 'approved' | 'rejected';
  review_comments?: string;
  description?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by_name?: string;
}

interface Robot {
  id: number;
  year: number;
  name: string;
  game: string;
  description: string | null;
  image_path: string | null;
  achievements: string | null;
  created_at: string;
  updated_at: string;
}

interface Sponsor {
  id: number;
  name: string;
  logo_path: string | null;
  website_url: string | null;
  tier: 'title_sponsor' | 'gold' | 'warrior' | 'black' | 'green';
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface ResourceCategory {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  resources?: Resource[];
}

interface Resource {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  file_path: string | null;
  category_id: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Subteam {
  id: number;
  name: string;
  description: string | null;
  is_primary: boolean;
  display_order: number;
  is_active: boolean;
}

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'slideshow' | 'robots' | 'sponsors' | 'resources' | 'subteams' | 'proposals'>('slideshow');
  const [slideshowImages, setSlideshowImages] = useState<SlideshowImage[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [resourceCategories, setResourceCategories] = useState<ResourceCategory[]>([]);
  const [subteams, setSubteams] = useState<Subteam[]>([]);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states for new slideshow image
  const [newImage, setNewImage] = useState({
    file_path: '',
    caption: '',
    display_order: 0
  });

  // State for caption editing
  const [editingCaption, setEditingCaption] = useState<{[key: number]: string}>({});
  const [editingCaptionId, setEditingCaptionId] = useState<number | null>(null);
  
  // State for upload captions
  const [uploadCaptions, setUploadCaptions] = useState<{[key: number]: string}>({});

  // Robots state
  const [robots, setRobots] = useState<Robot[]>([]);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [robotForm, setRobotForm] = useState({
    year: '',
    name: '',
    game: '',
    description: '',
    achievements: '',
    image: null as File | null
  });

  // Sponsors state
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    website_url: '',
    tier: 'green' as 'title_sponsor' | 'gold' | 'warrior' | 'black' | 'green',
    display_order: 0,
    logo: null as File | null
  });

  // Resources state
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    url: '',
    category_id: '',
    display_order: 0
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 0
  });

  // Subteams state
  const [editingSubteam, setEditingSubteam] = useState<Subteam | null>(null);
  const [subteamForm, setSubteamForm] = useState({
    name: '',
    description: '',
    is_primary: true,
    display_order: 0
  });

  const hasMaintenanceAccess = user?.maintenance_access;
  const isStudent = user?.role === 'student';
  const canApprove = user?.role === 'admin' || user?.role === 'mentor';

  useEffect(() => {
    fetchSlideshowImages();
    fetchProposedChanges();
    fetchRobots();
    fetchSponsors();
    fetchResourceCategories();
    fetchSubteams();
  }, []);

  const fetchSlideshowImages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/slideshow');
      setSlideshowImages(response.data || []);
    } catch (err: any) {
      setError('Failed to load slideshow images');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposedChanges = async () => {
    try {
      const response = await api.get('/maintenance/proposals');
      setProposedChanges(response.data || []);
    } catch (err: any) {
      console.log('Failed to load proposed changes (endpoint may not exist yet)');
    }
  };

  const fetchRobots = async () => {
    try {
      const response = await api.get('/robots');
      setRobots(response.data || []);
    } catch (err: any) {
      console.error('Error fetching robots:', err);
      setError('Failed to load robots data');
    }
  };

  const fetchSponsors = async () => {
    try {
      const response = await api.get('/sponsors');
      setSponsors(response.data || []);
    } catch (err: any) {
      console.error('Error fetching sponsors:', err);
      setError('Failed to load sponsors data');
    }
  };

  const fetchResourceCategories = async () => {
    try {
      const response = await api.get('/resources');
      setResourceCategories(response.data || []);
    } catch (err: any) {
      console.error('Error fetching resource categories:', err);
      setError('Failed to load resource categories');
    }
  };

  const fetchSubteams = async () => {
    try {
      const response = await api.get('/subteams');
      setSubteams(response.data || []);
    } catch (err: any) {
      console.error('Error fetching subteams:', err);
      setError('Failed to load subteams');
    }
  };

  const handleRobotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!robotForm.year || !robotForm.name || !robotForm.game) {
      setError('Year, name, and game are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('year', robotForm.year);
      formData.append('name', robotForm.name);
      formData.append('game', robotForm.game);
      if (robotForm.description) {
        formData.append('description', robotForm.description);
      }
      if (robotForm.achievements) {
        formData.append('achievements', robotForm.achievements);
      }
      if (robotForm.image) {
        formData.append('image', robotForm.image);
      }

      if (hasMaintenanceAccess && !isStudent) {
        // Direct access for mentors/admins
        if (editingRobot) {
          await api.put(`/robots/${editingRobot.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSuccessMessage('Robot updated successfully!');
        } else {
          await api.post('/robots', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSuccessMessage('Robot added successfully!');
        }
        fetchRobots();
      } else if (hasMaintenanceAccess) {
        // Proposal system for students
        // For robot proposals, we need to add additional fields to the form data
        formData.append('change_type', 'robot');
        formData.append('target_table', 'robots');
        if (editingRobot) {
          formData.append('target_id', editingRobot.id.toString());
          formData.append('description', `Proposed robot update for ${robotForm.year}: ${robotForm.name}`);
        } else {
          formData.append('description', `Proposed new robot for ${robotForm.year}: ${robotForm.name}`);
        }

        await api.post('/maintenance/propose', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Robot change proposed for review!');
        fetchProposedChanges();
      } else {
        setError("OOPS! You do not have maintenance access!");
        setLoading(false);
        return;
      }

      // Reset form
      setRobotForm({
        year: '',
        name: '',
        game: '',
        description: '',
        achievements: '',
        image: null
      });
      setEditingRobot(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save robot');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRobot = (robot: Robot) => {
    if (hasMaintenanceAccess && !isStudent) {
      // Direct edit for mentors/admins
      setRobotForm({
        year: robot.year.toString(),
        name: robot.name,
        game: robot.game,
        description: robot.description || '',
        achievements: robot.achievements || '',
        image: null
      });
      setEditingRobot(robot);
    } else if (hasMaintenanceAccess) {
      // For students, prepare a proposal
      setRobotForm({
        year: robot.year.toString(),
        name: robot.name,
        game: robot.game,
        description: robot.description || '',
        achievements: robot.achievements || '',
        image: null
      });
      setEditingRobot(robot);
    } else {
      setError("You don't have permission to edit robots");
    }
  };

  const handleDeleteRobot = async (robotId: number) => {
    if (!window.confirm('Are you sure you want to delete this robot? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      if (hasMaintenanceAccess && !isStudent) {
        // Direct delete for mentors/admins
        await api.delete(`/robots/${robotId}`);
        setSuccessMessage('Robot deleted successfully!');
        fetchRobots();
      } else if (hasMaintenanceAccess) {
        // Propose deletion for students
        const robot = robots.find(r => r.id === robotId);
        if (robot) {
          const formData = new FormData();
          formData.append('change_type', 'robot_delete');
          formData.append('target_table', 'robots');
          formData.append('target_id', robotId.toString());
          formData.append('description', `Proposed deletion of robot: ${robot.year} ${robot.name}`);

          await api.post('/maintenance/propose', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSuccessMessage('Robot deletion proposed for review!');
          fetchProposedChanges();
        }
      } else {
        setError("You don't have permission to delete robots");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete robot');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setRobotForm({
      year: '',
      name: '',
      game: '',
      description: '',
      achievements: '',
      image: null
    });
    setEditingRobot(null);
  };

  // Sponsor management functions
  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sponsorForm.name.trim()) {
      setError('Sponsor name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (hasMaintenanceAccess && !isStudent) {
        // Direct access for mentors/admins
        const formData = new FormData();
        formData.append('name', sponsorForm.name);
        formData.append('website_url', sponsorForm.website_url);
        formData.append('tier', sponsorForm.tier);
        formData.append('display_order', sponsorForm.display_order.toString());
        
        if (sponsorForm.logo) {
          formData.append('logo', sponsorForm.logo);
        }

        if (editingSponsor) {
          await api.put(`/sponsors/${editingSponsor.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSuccessMessage('Sponsor updated successfully!');
        } else {
          await api.post('/sponsors', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSuccessMessage('Sponsor added successfully!');
        }
        fetchSponsors();
      } else if (hasMaintenanceAccess) {
        // Proposal system for students
        const formData = new FormData();
        formData.append('change_type', 'sponsor');
        formData.append('target_table', 'sponsors');
        formData.append('sponsor_name', sponsorForm.name);
        formData.append('sponsor_url', sponsorForm.website_url);
        formData.append('sponsor_tier', sponsorForm.tier);
        formData.append('display_order', sponsorForm.display_order.toString());
        
        if (sponsorForm.logo) {
          formData.append('image', sponsorForm.logo);
        }
        
        if (editingSponsor) {
          formData.append('target_id', editingSponsor.id.toString());
          formData.append('description', `Proposed sponsor update: ${sponsorForm.name}`);
        } else {
          formData.append('description', `Proposed new sponsor: ${sponsorForm.name}`);
        }

        await api.post('/maintenance/propose', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Sponsor change proposed for review!');
        fetchProposedChanges();
      }

      // Reset form
      setSponsorForm({
        name: '',
        website_url: '',
        tier: 'green',
        display_order: 0,
        logo: null
      });
      setEditingSponsor(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save sponsor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSponsor = (sponsor: Sponsor) => {
    setSponsorForm({
      name: sponsor.name,
      website_url: sponsor.website_url || '',
      tier: sponsor.tier,
      display_order: sponsor.display_order,
      logo: null
    });
    setEditingSponsor(sponsor);
  };

  const handleDeleteSponsor = async (sponsorId: number) => {
    if (!window.confirm('Are you sure you want to delete this sponsor?')) {
      return;
    }

    try {
      setLoading(true);
      
      if (hasMaintenanceAccess && !isStudent) {
        // Direct delete for mentors/admins
        await api.delete(`/sponsors/${sponsorId}`);
        setSuccessMessage('Sponsor deleted successfully!');
        fetchSponsors();
      } else if (hasMaintenanceAccess) {
        // Propose deletion for students
        const sponsor = sponsors.find(s => s.id === sponsorId);
        if (sponsor) {
          const formData = new FormData();
          formData.append('change_type', 'sponsor_delete');
          formData.append('target_table', 'sponsors');
          formData.append('target_id', sponsorId.toString());
          formData.append('description', `Proposed deletion of sponsor: ${sponsor.name}`);

          await api.post('/maintenance/propose', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSuccessMessage('Sponsor deletion proposed for review!');
          fetchProposedChanges();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete sponsor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSponsorEdit = () => {
    setSponsorForm({
      name: '',
      website_url: '',
      tier: 'green',
      display_order: 0,
      logo: null
    });
    setEditingSponsor(null);
  };

  // Resource management functions
  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resourceForm.title.trim() || !resourceForm.category_id) {
      setError('Resource title and category are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (hasMaintenanceAccess && !isStudent) {
        // Direct access for mentors/admins
        const data = {
          title: resourceForm.title,
          description: resourceForm.description,
          url: resourceForm.url,
          category_id: parseInt(resourceForm.category_id),
          display_order: resourceForm.display_order
        };

        if (editingResource) {
          await api.put(`/resources/${editingResource.id}`, data);
          setSuccessMessage('Resource updated successfully!');
        } else {
          await api.post('/resources', data);
          setSuccessMessage('Resource added successfully!');
        }
        fetchResourceCategories();
      } else if (hasMaintenanceAccess) {
        // Proposal system for students
        const proposalData = {
          target_id : "",
          change_type: 'resource',
          target_table: 'resources',
          resource_title: resourceForm.title,
          resource_description: resourceForm.description,
          resource_url: resourceForm.url,
          category_id: resourceForm.category_id,
          display_order: resourceForm.display_order.toString(),
          description: editingResource 
            ? `Proposed resource update: ${resourceForm.title}`
            : `Proposed new resource: ${resourceForm.title}`
        };

        if (editingResource) {
          proposalData.target_id = editingResource.id.toString();
        }

        await api.post('/resources/propose', proposalData);
        setSuccessMessage('Resource change proposed for review!');
        fetchProposedChanges();
      }

      // Reset form
      setResourceForm({
        title: '',
        description: '',
        url: '',
        category_id: '',
        display_order: 0
      });
      setEditingResource(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (hasMaintenanceAccess && !isStudent) {
        // Direct access for mentors/admins
        const data = {
          name: categoryForm.name,
          description: categoryForm.description,
          display_order: categoryForm.display_order
        };

        if (editingCategory) {
          await api.put(`/resources/categories/${editingCategory.id}`, data);
          setSuccessMessage('Category updated successfully!');
        } else {
          await api.post('/resources/categories', data);
          setSuccessMessage('Category added successfully!');
        }
        fetchResourceCategories();
      } else if (hasMaintenanceAccess) {
        // Proposal system for students
        const proposalData = {
          target_id : "",
          change_type: 'resource_category',
          target_table: 'resource_categories',
          category_name: categoryForm.name,
          category_description: categoryForm.description,
          display_order: categoryForm.display_order.toString(),
          description: editingCategory 
            ? `Proposed category update: ${categoryForm.name}`
            : `Proposed new category: ${categoryForm.name}`
        };

        if (editingCategory) {
          proposalData.target_id = editingCategory.id.toString();
        }

        await api.post('/resources/propose', proposalData);
        setSuccessMessage('Category change proposed for review!');
        fetchProposedChanges();
      }

      // Reset form
      setCategoryForm({
        name: '',
        description: '',
        display_order: 0
      });
      setEditingCategory(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setResourceForm({
      title: resource.title,
      description: resource.description || '',
      url: resource.url || '',
      category_id: resource.category_id.toString(),
      display_order: resource.display_order
    });
    setEditingResource(resource);
  };

  const handleEditCategory = (category: ResourceCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order
    });
    setEditingCategory(category);
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      setLoading(true);
      
      if (hasMaintenanceAccess && !isStudent) {
        // Direct delete for mentors/admins
        await api.delete(`/resources/${resourceId}`);
        setSuccessMessage('Resource deleted successfully!');
        fetchResourceCategories();
      } else if (hasMaintenanceAccess) {
        // Propose deletion for students
        const proposalData = {
          change_type: 'resource_delete',
          target_table: 'resources',
          target_id: resourceId.toString(),
          description: 'Proposed resource deletion',
          proposed_data: ''
        };

        await api.post('/resources/propose', proposalData);
        setSuccessMessage('Resource deletion proposed for review!');
        fetchProposedChanges();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to delete this category? All resources in this category will be affected.')) {
      return;
    }

    try {
      setLoading(true);
      
      if (hasMaintenanceAccess && !isStudent) {
        // Direct delete for mentors/admins
        await api.delete(`/resources/categories/${categoryId}`);
        setSuccessMessage('Category deleted successfully!');
        fetchResourceCategories();
      } else if (hasMaintenanceAccess) {
        // Propose deletion for students
        const category = resourceCategories.find(c => c.id === categoryId);
        const proposalData = {
          change_type: 'resource_category_delete',
          target_table: 'resource_categories',
          target_id: categoryId.toString(),
          description: `Proposed deletion of category: ${category?.name}`
        };

        await api.post('/resources/propose', proposalData);
        setSuccessMessage('Category deletion proposed for review!');
        fetchProposedChanges();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelResourceEdit = () => {
    setResourceForm({
      title: '',
      description: '',
      url: '',
      category_id: '',
      display_order: 0
    });
    setEditingResource(null);
  };

  const handleCancelCategoryEdit = () => {
    setCategoryForm({
      name: '',
      description: '',
      display_order: 0
    });
    setEditingCategory(null);
  };

  const handleImageUpload = async (file: File, slot: number, caption?: string) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('slot', slot.toString());
    if (caption) {
      formData.append('caption', caption);
    }

    try {
      setLoading(true);
      setError('');
      
      if (hasMaintenanceAccess && !isStudent) {
        // Direct upload for maintenance users
        const response = await api.post('/slideshow/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Image uploaded successfully!');
        fetchSlideshowImages();
      } else if (hasMaintenanceAccess) {
        // Propose change for students - add required proposal fields
        formData.append('change_type', 'slideshow_image');
        formData.append('target_table', 'slideshow_images');
        formData.append('description', `Proposed slideshow image change for slot ${slot}`);
        
        await api.post('/maintenance/propose', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Change proposed for review!');
        fetchProposedChanges();
      } else{
        setError("OOPS! You do not have maintenence access!")
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      setLoading(true);
      await api.delete(`/slideshow/${imageId}`);
      setSuccessMessage('Image deleted successfully!');
      fetchSlideshowImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  // Subteam management handlers
  const handleSubteamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subteamForm.name.trim()) {
      setError('Subteam name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (hasMaintenanceAccess && !isStudent) {
        // Direct action for mentors/admins
        if (editingSubteam) {
          await api.put(`/subteams/${editingSubteam.id}`, subteamForm);
          setSuccessMessage('Subteam updated successfully!');
        } else {
          await api.post('/subteams', subteamForm);
          setSuccessMessage('Subteam created successfully!');
        }
        fetchSubteams();
      } else if (hasMaintenanceAccess) {
        // Proposal system for students
        const proposalData = {
          change_type: editingSubteam ? 'subteam_update' : 'subteam_create',
          target_table: 'subteams',
          target_id: editingSubteam?.id?.toString(),
          proposed_data: subteamForm,
          description: editingSubteam 
            ? `Proposed update to subteam: ${editingSubteam.name} → ${subteamForm.name}`
            : `Proposed new subteam: ${subteamForm.name}`
        };
        
        await api.post('/maintenance/propose', proposalData);
        setSuccessMessage('Subteam change proposed for review!');
        fetchProposedChanges();
      }

      setSubteamForm({
        name: '',
        description: '',
        is_primary: true,
        display_order: 0
      });
      setEditingSubteam(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save subteam');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubteam = (subteam: Subteam) => {
    setSubteamForm({
      name: subteam.name,
      description: subteam.description || '',
      is_primary: subteam.is_primary,
      display_order: subteam.display_order
    });
    setEditingSubteam(subteam);
  };

  const handleDeleteSubteam = async (subteamId: number) => {
    if (!window.confirm('Are you sure you want to delete this subteam? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      
      if (hasMaintenanceAccess && !isStudent) {
        // Direct delete for mentors/admins
        await api.delete(`/subteams/${subteamId}`);
        setSuccessMessage('Subteam deleted successfully!');
        fetchSubteams();
      } else if (hasMaintenanceAccess) {
        // Propose deletion for students
        const subteam = subteams.find(s => s.id === subteamId);
        const proposalData = {
          change_type: 'subteam_delete',
          target_table: 'subteams',
          target_id: subteamId.toString(),
          description: `Proposed deletion of subteam: ${subteam?.name}`
        };
        await api.post('/maintenance/propose', proposalData);
        setSuccessMessage('Subteam deletion proposed for review!');
        fetchProposedChanges();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete subteam');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubteamEdit = () => {
    setSubteamForm({
      name: '',
      description: '',
      is_primary: true,
      display_order: 0
    });
    setEditingSubteam(null);
  };

  const handleUpdateCaption = async (imageId: number, newCaption: string) => {
    try {
      setLoading(true);
      await api.put(`/slideshow/${imageId}`, { caption: newCaption });
      setSuccessMessage('Caption updated successfully!');
      setEditingCaptionId(null);
      setEditingCaption({});
      fetchSlideshowImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update caption');
    } finally {
      setLoading(false);
    }
  };

  const startEditingCaption = (imageId: number, currentCaption: string) => {
    setEditingCaptionId(imageId);
    setEditingCaption({ [imageId]: currentCaption || '' });
  };

  const cancelEditingCaption = () => {
    setEditingCaptionId(null);
    setEditingCaption({});
  };

  const handleApproveProposal = async (proposalId: number, action: 'approve' | 'reject', notes?: string) => {
    try {
      setLoading(true);
      await api.put(`/maintenance/proposals/${proposalId}/${action}`, { notes });
      setSuccessMessage(`Proposal ${action}d successfully!`);
      fetchProposedChanges();
      if (action === 'approve') {
        fetchSlideshowImages();
        fetchRobots(); // Also refresh robots when robot proposals are approved
        fetchSponsors(); // Refresh sponsors when sponsor proposals are approved
        fetchResourceCategories(); // Refresh resources when resource proposals are approved
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} proposal`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Please log in.
        </div>
      </div>
    );
  }

  const canAccessMaintenance = hasMaintenanceAccess;

  if (!canAccessMaintenance) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Only those with maintenence access can access maintenence.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-impact text-swat-black mb-2">MAINTENANCE</h1>
        <p className="text-gray-600">
          {canApprove 
            ? "Manage website content and review proposed changes" 
            : "Propose changes to website content for review"}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('slideshow')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'slideshow'
                ? 'border-swat-green text-swat-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Slideshow Images
          </button>
          <button
            onClick={() => setActiveTab('robots')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'robots'
                ? 'border-swat-green text-swat-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Robots Timeline
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sponsors'
                ? 'border-swat-green text-swat-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sponsors
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'resources'
                ? 'border-swat-green text-swat-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resources
          </button>
          {hasMaintenanceAccess && (
            <button
              onClick={() => setActiveTab('subteams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'subteams'
                  ? 'border-swat-green text-swat-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subteams
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => setActiveTab('proposals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'proposals'
                  ? 'border-swat-green text-swat-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Proposed Changes ({proposedChanges.filter(p => p.status === 'pending').length})
            </button>
          )}
        </nav>
      </div>

      {/* Slideshow Management Tab */}
      {activeTab === 'slideshow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-impact text-swat-black mb-4">SLIDESHOW IMAGES</h2>
            <p className="text-gray-600 mb-6">
              {(hasMaintenanceAccess && canApprove)  
                ? "Upload and manage slideshow images that appear on the home page."
                : "Propose new slideshow images for review by mentors or admins."}
            </p>

            {/* Slideshow Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 8 }, (_, index) => {
                const slot = index + 1;
                const existingImage = slideshowImages.find(img => img.display_order === slot);
                
                return (
                  <div key={slot} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Slot {slot}</h3>
                    
                    {existingImage ? (
                      <div className="space-y-3">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={existingImage.file_path}
                            alt={existingImage.caption || `Slide ${slot}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                            }}
                          />
                        </div>
                        {/* Caption editing */}
                        {editingCaptionId === existingImage.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingCaption[existingImage.id] || ''}
                              onChange={(e) => setEditingCaption({ ...editingCaption, [existingImage.id]: e.target.value })}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                              placeholder="Enter caption..."
                              autoFocus
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateCaption(existingImage.id, editingCaption[existingImage.id] || '')}
                                className="px-2 py-1 bg-swat-green text-white text-xs rounded hover:bg-swat-green-dark transition-colors"
                                disabled={loading}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingCaption}
                                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 flex-1">{existingImage.caption}</div>
                            {hasMaintenanceAccess && (
                              <button
                                onClick={() => startEditingCaption(existingImage.id, existingImage.caption || '')}
                                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                              >
                                Edit Caption
                              </button>
                            )}
                          </div>
                        )}
                        {(hasMaintenanceAccess && !isStudent) && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Caption for new image (optional)"
                              value={uploadCaptions[slot] || ''}
                              onChange={(e) => setUploadCaptions({ ...uploadCaptions, [slot]: e.target.value })}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            />
                            <div className="flex space-x-2">
                              <label className="flex-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(file, slot, uploadCaptions[slot]);
                                      // Clear the caption input after upload
                                      setUploadCaptions({ ...uploadCaptions, [slot]: '' });
                                    }
                                  }}
                                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-swat-green file:text-white hover:file:bg-swat-green-dark"
                                />
                              </label>
                              <button
                                onClick={() => handleDeleteImage(existingImage.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                        {(hasMaintenanceAccess && isStudent) && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Caption for proposed image (optional)"
                              value={uploadCaptions[slot] || ''}
                              onChange={(e) => setUploadCaptions({ ...uploadCaptions, [slot]: e.target.value })}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            />
                            <label className="block">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, slot, uploadCaptions[slot]);
                                    // Clear the caption input after upload
                                    setUploadCaptions({ ...uploadCaptions, [slot]: '' });
                                  }
                                }}
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-swat-green file:text-white hover:file:bg-swat-green-dark"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-500">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">Empty Slot</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Caption for image (optional)"
                            value={uploadCaptions[slot] || ''}
                            onChange={(e) => setUploadCaptions({ ...uploadCaptions, [slot]: e.target.value })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          />
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file, slot, uploadCaptions[slot]);
                                  // Clear the caption input after upload
                                  setUploadCaptions({ ...uploadCaptions, [slot]: '' });
                                }
                              }}
                              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-swat-green file:text-white hover:file:bg-swat-green-dark"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Proposals Tab (Admin/Mentor only) */}
      {activeTab === 'proposals' && canApprove && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-impact text-swat-black mb-4">PROPOSED CHANGES</h2>
            <p className="text-gray-600 mb-6">
              Review and approve or reject changes proposed by students.
            </p>

            {proposedChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No proposed changes at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {proposedChanges.map((proposal) => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {proposal.change_type === 'slideshow_image' ? 'Slideshow Image Change' :
                           proposal.change_type === 'robot' ? 'Robot Addition/Update' :
                           proposal.change_type === 'robot_delete' ? 'Robot Deletion' :
                           proposal.change_type === 'sponsor' ? 'Sponsor Addition/Update' :
                           proposal.change_type === 'sponsor_delete' ? 'Sponsor Deletion' :
                           proposal.change_type === 'resource' ? 'Resource Addition/Update' :
                           proposal.change_type === 'resource_delete' ? 'Resource Deletion' :
                           proposal.change_type === 'resource_category' ? 'Resource Category Addition/Update' :
                           proposal.change_type === 'resource_category_delete' ? 'Resource Category Deletion' :
                           proposal.change_type === 'subteam_create' ? 'Subteam Creation' :
                           proposal.change_type === 'subteam_update' ? 'Subteam Update' :
                           proposal.change_type === 'subteam_delete' ? 'Subteam Deletion' :
                           proposal.change_type}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Proposed by {proposal.proposed_by_name} on {new Date(proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {proposal.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Proposal Details */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      {proposal.change_type === 'slideshow_image' && (
                        <div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Slot:</strong> {proposal.proposed_data.slot}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Caption:</strong> {proposal.proposed_data.caption || 'No caption'}
                          </p>
                          {proposal.proposed_data.file_path && (
                            <div className="mt-2">
                              <img 
                                src={proposal.proposed_data.file_path} 
                                alt="Proposed slideshow image"
                                className="max-w-xs h-32 object-cover rounded"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {proposal.change_type === 'robot' && (
                        <div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Year:</strong> {proposal.proposed_data.year}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Name:</strong> {proposal.proposed_data.name}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Game:</strong> {proposal.proposed_data.game}
                          </p>
                          {proposal.proposed_data.robot_description && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Description:</strong> {proposal.proposed_data.robot_description}
                            </p>
                          )}
                          {proposal.proposed_data.achievements && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Achievements:</strong> {proposal.proposed_data.achievements}
                            </p>
                          )}
                          {proposal.proposed_data.image_path && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700">Robot Image:</strong>
                              <img 
                                src={proposal.proposed_data.image_path} 
                                alt="Proposed robot image"
                                className="max-w-xs h-32 object-cover rounded mt-1"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {proposal.change_type === 'robot_delete' && (
                        <div>
                          <p className="text-sm text-gray-700">
                            This proposal requests deletion of a robot from the timeline.
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'sponsor' && (
                        <div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Name:</strong> {proposal.proposed_data.name}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Tier:</strong> <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${
                              proposal.proposed_data.tier === 'title_sponsor' ? 'bg-swat-gradient' :
                              proposal.proposed_data.tier === 'gold' ? 'bg-yellow-500' :
                              proposal.proposed_data.tier === 'warrior' ? 'bg-warrior-gradient' :
                              proposal.proposed_data.tier === 'black' ? 'bg-gray-800' : 'bg-green-600'
                            }`}>
                              {proposal.proposed_data.tier === 'title_sponsor' ? 'Title Sponsor' : proposal.proposed_data.tier.charAt(0).toUpperCase() + proposal.proposed_data.tier.slice(1)}
                            </span>
                          </p>
                          {proposal.proposed_data.website_url && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Website:</strong> {proposal.proposed_data.website_url}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Display Order:</strong> {proposal.proposed_data.display_order}
                          </p>
                          {proposal.proposed_data.logo_path && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700">Logo:</strong>
                              <img 
                                src={proposal.proposed_data.logo_path} 
                                alt="Proposed sponsor logo"
                                className="max-w-xs h-32 object-contain rounded mt-1 bg-gray-100 p-2"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {proposal.change_type === 'sponsor_delete' && (
                        <div>
                          <p className="text-sm text-gray-700">
                            This proposal requests deletion of a sponsor.
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'resource' && (
                        <div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Title:</strong> {proposal.proposed_data.title}
                          </p>
                          {proposal.proposed_data.description && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Description:</strong> {proposal.proposed_data.description}
                            </p>
                          )}
                          {proposal.proposed_data.url && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>URL:</strong> {proposal.proposed_data.url}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Category ID:</strong> {proposal.proposed_data.category_id}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Display Order:</strong> {proposal.proposed_data.display_order}
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'resource_delete' && (
                        <div>
                          <p className="text-sm text-gray-700">
                            This proposal requests deletion of a resource.
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'resource_category' && (
                        <div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Name:</strong> {proposal.proposed_data.name}
                          </p>
                          {proposal.proposed_data.description && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Description:</strong> {proposal.proposed_data.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Display Order:</strong> {proposal.proposed_data.display_order}
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'resource_category_delete' && (
                        <div>
                          <p className="text-sm text-gray-700">
                            This proposal requests deletion of a resource category.
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'subteam_create' && (
                        <div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Name:</strong> {proposal.proposed_data.name}
                          </p>
                          {proposal.proposed_data.description && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Description:</strong> {proposal.proposed_data.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Type:</strong> {proposal.proposed_data.is_primary ? 'Primary' : 'Secondary'} Subteam
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Display Order:</strong> {proposal.proposed_data.display_order}
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'subteam_update' && (
                        <div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Name:</strong> {proposal.proposed_data.name}
                          </p>
                          {proposal.proposed_data.description && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Description:</strong> {proposal.proposed_data.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Type:</strong> {proposal.proposed_data.is_primary ? 'Primary' : 'Secondary'} Subteam
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Display Order:</strong> {proposal.proposed_data.display_order}
                          </p>
                        </div>
                      )}

                      {proposal.change_type === 'subteam_delete' && (
                        <div>
                          <p className="text-sm text-gray-700">
                            This proposal requests deletion of a subteam.
                          </p>
                        </div>
                      )}
                      
                      {proposal.description && (
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Description:</strong> {proposal.description}
                        </p>
                      )}
                    </div>

                    {proposal.status === 'pending' && (
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => handleApproveProposal(proposal.id, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Rejection reason (optional):');
                            handleApproveProposal(proposal.id, 'reject', notes || undefined);
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {proposal.review_comments && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <strong>Review Comments:</strong> {proposal.review_comments}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Robots Management Tab */}
      {activeTab === 'robots' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-impact text-swat-black mb-4">ROBOTS TIMELINE</h2>
            <p className="text-gray-600 mb-6">
              {(hasMaintenanceAccess && !isStudent)
                ? "Manage the robots that appear on the robots timeline page. Add new robots, edit existing ones, or delete old entries."
                : "Propose changes to the robots timeline. Your proposals will be reviewed by mentors or admins before being applied."}
            </p>

            {/* Robot Form */}
            <form onSubmit={handleRobotSubmit} className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                {(hasMaintenanceAccess && !isStudent)
                  ? (editingRobot ? 'Edit Robot' : 'Add New Robot')
                  : (editingRobot ? 'Propose Robot Update' : 'Propose New Robot')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={robotForm.year}
                    onChange={(e) => setRobotForm({...robotForm, year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Robot Name *
                  </label>
                  <input
                    type="text"
                    value={robotForm.name}
                    onChange={(e) => setRobotForm({...robotForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Name *
                  </label>
                  <input
                    type="text"
                    value={robotForm.game}
                    onChange={(e) => setRobotForm({...robotForm, game: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Robot Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setRobotForm({...robotForm, image: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Robot Description
                </label>
                <textarea
                  value={robotForm.description}
                  onChange={(e) => setRobotForm({...robotForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                  placeholder="Describe the robot's design, capabilities, and features..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievements & Competition Results
                </label>
                <textarea
                  value={robotForm.achievements}
                  onChange={(e) => setRobotForm({...robotForm, achievements: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                  placeholder="List competition results, awards, and notable achievements..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-swat-green text-white px-6 py-2 rounded-md hover:bg-swat-green/90 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Saving...' : (
                    (hasMaintenanceAccess && !isStudent)
                      ? (editingRobot ? 'Update Robot' : 'Add Robot')
                      : (editingRobot ? 'Propose Update' : 'Propose Robot')
                  )}
                </button>
                {editingRobot && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Existing Robots List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Robots</h3>
              {robots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No robots added yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {robots.map((robot) => (
                    <div key={robot.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            {robot.image_path && (
                              <img
                                src={robot.image_path}
                                alt={robot.name}
                                className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                              />
                            )}
                            <div>
                              <h4 className="text-lg font-semibold text-swat-green">
                                {robot.year}: {robot.game}
                              </h4>
                              <p className="text-gray-900 font-medium">{robot.name}</p>
                            </div>
                          </div>
                          
                          {robot.description && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-700">
                                <strong>Description:</strong> {robot.description.substring(0, 200)}
                                {robot.description.length > 200 && '...'}
                              </p>
                            </div>
                          )}
                          
                          {robot.achievements && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-700">
                                <strong>Achievements:</strong> {robot.achievements.substring(0, 200)}
                                {robot.achievements.length > 200 && '...'}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditRobot(robot)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            {(hasMaintenanceAccess && !isStudent) ? 'Edit' : 'Propose Edit'}
                          </button>
                          <button
                            onClick={() => handleDeleteRobot(robot.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            {(hasMaintenanceAccess && !isStudent) ? 'Delete' : 'Propose Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sponsors Management Tab */}
      {activeTab === 'sponsors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-impact text-swat-black mb-4">SPONSORS</h2>
            <p className="text-gray-600 mb-6">
              {(hasMaintenanceAccess && !isStudent)
                ? "Manage sponsors and their tiers. Upload logos, set tiers, and control display order."
                : "Propose changes to sponsors. Your proposals will be reviewed by mentors or admins before being applied."}
            </p>

            {/* Sponsor Form */}
            <form onSubmit={handleSponsorSubmit} className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                {(hasMaintenanceAccess && !isStudent)
                  ? (editingSponsor ? 'Edit Sponsor' : 'Add New Sponsor')
                  : (editingSponsor ? 'Propose Sponsor Update' : 'Propose New Sponsor')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sponsor Name *
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.name}
                    onChange={(e) => setSponsorForm({...sponsorForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={sponsorForm.website_url}
                    onChange={(e) => setSponsorForm({...sponsorForm, website_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sponsor Tier *
                  </label>
                  <select
                    value={sponsorForm.tier}
                    onChange={(e) => setSponsorForm({...sponsorForm, tier: e.target.value as 'title_sponsor' | 'gold' | 'warrior' | 'black' | 'green'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    required
                  >
                    <option value="title_sponsor">Title Sponsor</option>
                    <option value="gold">Gold</option>
                    <option value="warrior">Warrior</option>
                    <option value="black">Black</option>
                    <option value="green">Green</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sponsorForm.display_order}
                    onChange={(e) => setSponsorForm({...sponsorForm, display_order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sponsor Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSponsorForm({...sponsorForm, logo: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-swat-green text-white px-6 py-2 rounded-md hover:bg-swat-green/90 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Saving...' : (
                    (hasMaintenanceAccess && !isStudent)
                      ? (editingSponsor ? 'Update Sponsor' : 'Add Sponsor')
                      : (editingSponsor ? 'Propose Update' : 'Propose Sponsor')
                  )}
                </button>
                {editingSponsor && (
                  <button
                    type="button"
                    onClick={handleCancelSponsorEdit}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Existing Sponsors List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Sponsors</h3>
              {sponsors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sponsors added yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {sponsors.map((sponsor) => (
                    <div key={sponsor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            {sponsor.logo_path && (
                              <img
                                src={sponsor.logo_path}
                                alt={sponsor.name}
                                className="w-16 h-16 object-contain rounded-lg bg-gray-100 p-2"
                              />
                            )}
                            <div>
                              <h4 className="text-lg font-semibold text-swat-green">
                                {sponsor.name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${
                                  sponsor.tier === 'title_sponsor' ? 'bg-swat-gradient' :
                                  sponsor.tier === 'gold' ? 'bg-yellow-500' :
                                  sponsor.tier === 'warrior' ? 'bg-warrior-gradient'  :
                                  sponsor.tier === 'black' ? 'bg-gray-800' : 'bg-green-600'
                                }`}>
                                  {sponsor.tier === 'title_sponsor' ? 'Title Sponsor' : sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
                                </span>
                                <span className="text-sm text-gray-500">Order: {sponsor.display_order}</span>
                              </div>
                            </div>
                          </div>
                          
                          {sponsor.website_url && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-700">
                                <strong>Website:</strong>
                                <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" 
                                   className="text-swat-green hover:underline ml-1">
                                  {sponsor.website_url}
                                </a>
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditSponsor(sponsor)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            {(hasMaintenanceAccess && !isStudent) ? 'Edit' : 'Propose Edit'}
                          </button>
                          <button
                            onClick={() => handleDeleteSponsor(sponsor.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            {(hasMaintenanceAccess && !isStudent) ? 'Delete' : 'Propose Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resources Management Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-impact text-swat-black mb-4">RESOURCES</h2>
            <p className="text-gray-600 mb-6">
              {(hasMaintenanceAccess && !isStudent)
                ? "Manage resource categories and individual resources. Add links, files, and organize content."
                : "Propose changes to resources and categories. Your proposals will be reviewed by mentors or admins before being applied."}
            </p>

            {/* Category Management */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Categories</h3>
              
              {/* Category Form */}
              <form onSubmit={handleCategorySubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">
                  {(hasMaintenanceAccess && !isStudent)
                    ? (editingCategory ? 'Edit Category' : 'Add New Category')
                    : (editingCategory ? 'Propose Category Update' : 'Propose New Category')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={categoryForm.display_order}
                      onChange={(e) => setCategoryForm({...categoryForm, display_order: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-swat-green text-white px-4 py-2 rounded-md hover:bg-swat-green/90 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Saving...' : (
                      (hasMaintenanceAccess && !isStudent)
                        ? (editingCategory ? 'Update Category' : 'Add Category')
                        : (editingCategory ? 'Propose Update' : 'Propose Category')
                    )}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Categories List */}
              <div className="grid gap-2">
                {resourceCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-medium text-gray-900">{category.name}</h5>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                        <p className="text-xs text-gray-500">Order: {category.display_order} | {category.resources?.length || 0} resources</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          {(hasMaintenanceAccess && !isStudent) ? 'Edit' : 'Propose Edit'}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          {(hasMaintenanceAccess && !isStudent) ? 'Delete' : 'Propose Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Management */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Resources</h3>
              
              {/* Resource Form */}
              <form onSubmit={handleResourceSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">
                  {(hasMaintenanceAccess && !isStudent)
                    ? (editingResource ? 'Edit Resource' : 'Add New Resource')
                    : (editingResource ? 'Propose Resource Update' : 'Propose New Resource')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Title *
                    </label>
                    <input
                      type="text"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={resourceForm.category_id}
                      onChange={(e) => setResourceForm({...resourceForm, category_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                      required
                    >
                      <option value="">Select a category</option>
                      {resourceCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={resourceForm.url}
                      onChange={(e) => setResourceForm({...resourceForm, url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={resourceForm.display_order}
                      onChange={(e) => setResourceForm({...resourceForm, display_order: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    placeholder="Describe what this resource is about..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-swat-green text-white px-4 py-2 rounded-md hover:bg-swat-green/90 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Saving...' : (
                      (hasMaintenanceAccess && !isStudent)
                        ? (editingResource ? 'Update Resource' : 'Add Resource')
                        : (editingResource ? 'Propose Update' : 'Propose Resource')
                    )}
                  </button>
                  {editingResource && (
                    <button
                      type="button"
                      onClick={handleCancelResourceEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Resources by Category */}
              {resourceCategories.map((category) => (
                <div key={category.id} className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">{category.name}</h4>
                  {category.resources && category.resources.length > 0 ? (
                    <div className="grid gap-2">
                      {category.resources.map((resource) => (
                        <div key={resource.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{resource.title}</h5>
                              {resource.description && (
                                <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                              )}
                              {resource.url && (
                                <div className="mt-1">
                                  <a 
                                    href={resource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-swat-green hover:underline"
                                  >
                                    {resource.url}
                                  </a>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-1">Order: {resource.display_order}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditResource(resource)}
                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                              >
                                {(hasMaintenanceAccess && !isStudent) ? 'Edit' : 'Propose Edit'}
                              </button>
                              <button
                                onClick={() => handleDeleteResource(resource.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                              >
                                {(hasMaintenanceAccess && !isStudent) ? 'Delete' : 'Propose Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No resources in this category yet.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subteams Management Tab */}
      {activeTab === 'subteams' && hasMaintenanceAccess && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-impact text-swat-black mb-4">SUBTEAMS</h2>
            <p className="text-gray-600 mb-6">
              Manage the team's subteams. Primary subteams are main divisions, while secondary subteams are special interest groups.
            </p>

            {/* Subteam Form */}
            <form onSubmit={handleSubteamSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {(hasMaintenanceAccess && !isStudent)
                  ? (editingSubteam ? 'Edit Subteam' : 'Add New Subteam')
                  : (editingSubteam ? 'Propose Subteam Edit' : 'Propose New Subteam')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subteam Name *
                  </label>
                  <input
                    type="text"
                    value={subteamForm.name}
                    onChange={(e) => setSubteamForm({ ...subteamForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={subteamForm.display_order}
                    onChange={(e) => setSubteamForm({ ...subteamForm, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={subteamForm.description}
                  onChange={(e) => setSubteamForm({ ...subteamForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                  rows={3}
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={subteamForm.is_primary}
                    onChange={(e) => setSubteamForm({ ...subteamForm, is_primary: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Primary Subteam (main division vs special interest group)
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-swat-green text-white px-4 py-2 rounded-md hover:bg-green-600 font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 
                    (hasMaintenanceAccess && !isStudent)
                      ? (editingSubteam ? 'Update Subteam' : 'Add Subteam')
                      : (editingSubteam ? 'Propose Update' : 'Propose Addition')}
                </button>
                {editingSubteam && (
                  <button
                    type="button"
                    onClick={handleCancelSubteamEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Subteams List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Subteams</h3>
              
              {/* Primary Subteams */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Primary Subteams</h4>
                <div className="grid gap-3">
                  {subteams.filter(s => s.is_primary && s.is_active).map((subteam) => (
                    <div key={subteam.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{subteam.name}</h5>
                          {subteam.description && (
                            <p className="text-gray-600 text-sm mt-1">{subteam.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Display Order: {subteam.display_order}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditSubteam(subteam)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubteam(subteam.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                          >
                            {(hasMaintenanceAccess && !isStudent) ? 'Delete' : 'Propose Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Subteams */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Secondary Subteams</h4>
                <div className="grid gap-3">
                  {subteams.filter(s => !s.is_primary && s.is_active).map((subteam) => (
                    <div key={subteam.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{subteam.name}</h5>
                          {subteam.description && (
                            <p className="text-gray-600 text-sm mt-1">{subteam.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Display Order: {subteam.display_order}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditSubteam(subteam)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubteam(subteam.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                          >
                            {(hasMaintenanceAccess && !isStudent) ? 'Delete' : 'Propose Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {subteams.filter(s => s.is_active).length === 0 && (
                <p className="text-gray-500 text-center py-4">No subteams configured yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;