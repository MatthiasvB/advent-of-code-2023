use core::panic;
use lazy_static::lazy_static;
use regex::Regex;
use std::collections::{BTreeMap, HashMap};
use fnv::FnvBuildHasher;

type MyMap<K, V> = HashMap<K, V, FnvBuildHasher>;

lazy_static! {
    static ref END_IN_Z: Regex = Regex::new("Z$").unwrap();
    static ref END_IN_A: Regex = Regex::new("A$").unwrap();
    static ref MAP_PARSER: Regex =
        Regex::new("^([A-Z0-9]{3}) = \\(([A-Z0-9]{3}), ([A-Z0-9]{3})\\)$").unwrap();
}

#[derive(Debug)]
struct LeftRight {
    left: String,
    right: String,
}

pub struct Itertool {
    full_range_target: String,
    end_in_z_after: usize,
    next_z: usize,
}

type ItertoolMap = MyMap<String, Itertool>;

// inspired by https://stackoverflow.com/questions/31302054/how-to-find-the-least-common-multiple-of-a-range-of-numbers
pub fn least_common_multiple(numbers: Vec<isize>) -> isize {
    fn gcd(a: &isize, b: &isize) -> isize {
        return if *b == 0 {
            a.to_owned()
        } else {
            gcd(b, &(*a % *b))
        };
    }

    fn lcm(a: &isize, b: &isize) -> isize {
        (a * b) / gcd(a, b)
    }

    numbers.iter().fold(1, |multiple, num| lcm(&multiple, num))
}

pub struct Walker {
    walk_instructions: String,
    left_right_map: MyMap<String, LeftRight>, // needed?
    itertools: MyMap<String, Itertool>,
}

impl Walker {
    fn new(walk_instructions: String, left_right_map: MyMap<String, LeftRight>) -> Self {
        println!("Creating new Walker");
        let mut itertools = ItertoolMap::default();
        itertools.extend(left_right_map.keys().map(|key| {
            // println!("Computing target for {}", key);
            let full_range_target =
                target_after_full_rl_range(&key, &walk_instructions, &left_right_map);
            // println!("Computed target for {}", key);
            // println!("Computing end in z after for {}", key);
            let end_in_z_after =
                walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &false);
            // println!("Computed end in z after for {}", key);
            // println!("Computing end in z after for {} with force", key);
            let next_z = walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &true);
            // println!("Computing end in z after for {} with force", key);
            (
                key.to_owned(),
                Itertool {
                    full_range_target,
                    end_in_z_after,
                    next_z,
                },
            )
        }));
        println!("Created new Walker");
        Self {
            left_right_map,
            walk_instructions,
            itertools,
        }
    }

    // private getAllLocationsMatching(matcher: RegExp) {
    //   return [...this.leftRightMap.keys()].filter((key) => matcher.test(key));
    // }

    fn get_all_locations_matching(self: &Self, matcher: &Regex) -> Vec<String> {
        self.left_right_map
            .keys()
            .filter(|key| matcher.is_match(key))
            .cloned()
            .collect()
    }

    fn walk_by_jump_map(self: &Self) -> usize {
        let jump_map = self.get_jump_map();
        let mut steps = 0;

        let rust_temporary = self.get_all_locations_matching(&END_IN_A);
        let mut currents = rust_temporary.iter().map(|x| { x }).collect();

        let mut last = 0;
        let print_every = 50_000_000_000;
        

        let walk_instructions_length = self.walk_instructions.len(); // optimization

        while !self.have_same_z_distance(&currents) {
            let full_length_jumps = self.max_z_distance(&currents) / walk_instructions_length;

            if full_length_jumps == 0 {
                panic!("Stuck!")
            }

            steps += full_length_jumps * walk_instructions_length;

            if steps - last >= print_every {
                println!("Now at {steps}");
                last = steps;
            }

            for current in &mut currents { 
                *current = &jump_map.get(*current).unwrap()[full_length_jumps]; 
            }
        }

        steps + self.itertools.get(currents[0]).unwrap().end_in_z_after
    }

    fn max_z_distance(self: &Self, currents: &Vec<&String>) -> usize {
        currents
            .iter()
            .map(|current| self.itertools.get(*current).map(|c| c.next_z).unwrap_or(0))
            .max()
            .unwrap_or(0)
    }

    fn have_same_z_distance(self: &Self, keys: &Vec<&String>) -> bool {
        let z_distance_0 = self.itertools.get(keys[0]).unwrap().end_in_z_after;
        for key in keys {
            if self.itertools.get(*key).unwrap().end_in_z_after != z_distance_0 {
                return false;
            }
        }
        true
    }

    /**
     * Do two types of analyses at once, for performance optimization. Doesn't seem to do much, though
     */
    fn combined_have_same_z_distance_and_max_z_distance(self: &Self, keys: &Vec<&String>) -> (bool, usize) {
        let z_distance_0 = self.itertools.get(keys[0]).unwrap().end_in_z_after;
        let mut current_z_distance;
        let mut max_z_distance = z_distance_0;
        let mut have_same_distance = true;
        for key in keys {
            current_z_distance = self.itertools.get(*key).unwrap().end_in_z_after;
            if have_same_distance && current_z_distance != z_distance_0 {
                have_same_distance = false;
            }
            if (current_z_distance > max_z_distance) {
                max_z_distance = current_z_distance;
            }
        }
        (have_same_distance, max_z_distance)
    }

    fn get_jump_map(self: &Self) -> MyMap<String, Vec<String>> {
        println!("Computing jump map");
        let all_keys = self.left_right_map.keys();
        println!("Number of keys: {}", self.left_right_map.keys().len());
        let all_distances_to_z = all_keys.clone().map(|key| {
            walk_from_to(
                &key,
                &END_IN_Z,
                &self.walk_instructions,
                &self.left_right_map,
                &false,
            )
        });
        let max_distance = all_distances_to_z.clone().max().unwrap();
        let max_jumpable_distance = max_distance - (max_distance % self.walk_instructions.len());
        println!("Max jumpable distance: {max_jumpable_distance}");
        let mut jump_map = MyMap::default();
        jump_map.extend(all_keys.map(|key| {
            let mut jump_list: Vec<String> = vec![key.to_owned()];
            let mut current = key;
            for i in 0..max_jumpable_distance {
                let next_instruction = self.left_right_map.get(current).unwrap();
                let lr = self
                    .walk_instructions
                    .chars()
                    .nth(i % self.walk_instructions.len())
                    .unwrap();
                let next = if lr == 'L' {
                    &next_instruction.left
                } else {
                    &next_instruction.right
                };
                if (i + 1) % self.walk_instructions.len() == 0 {
                    jump_list.push(next.to_owned())
                };
                current = next;
            }
            println!("Jump list has length: {}", jump_list.len());
            (key.to_owned(), jump_list)
        }));
        println!("Computed jump map");
        jump_map
    }
}

fn walk_from_to(
    from: &str,
    to: &Regex,
    walk_instructions: &str,
    left_right_map: &MyMap<String, LeftRight>,
    force_walk: &bool,
) -> usize {
    let mut current = from;
    let mut steps = 0;

    while !to.is_match(current) || (*force_walk && steps == 0) {
        let next_rl_instruction = walk_instructions.as_bytes()[steps % walk_instructions.len()] as char;
        let next_lr = left_right_map.get(current).unwrap();
        current = if next_rl_instruction == 'L' {
            &next_lr.left
        } else {
            &next_lr.right
        };

        steps += 1;
    }

    steps
}

fn target_after_full_rl_range(
    from: &str,
    walk_instructions: &str,
    lr_map: &MyMap<String, LeftRight>,
) -> String {
    let mut current = from;

    walk_instructions.chars().for_each(|lr| {
        let next_instruction = lr_map.get(current).unwrap();
        current = if lr == 'L' {
            &next_instruction.left
        } else {
            &next_instruction.right
        };
    });

    current.to_owned()
}

pub fn parse_challenge(input: &str) -> Walker {
    match input.trim().split("\n\n").collect::<Vec<&str>>()[0..2] {
        [lr, raw_map] => {
            let mut map = MyMap::default();
            raw_map
                .split("\n")
                .map(|line| {
                    MAP_PARSER
                        .captures(line)
                        .unwrap()
                        .iter()
                        .skip(1)
                        .map(|c| c.unwrap().as_str())
                        .collect::<Vec<&str>>()
                })
                .filter(|matches| {
                    matches.len() >= 3
                })
                .for_each(|matches| {
                    println!("Inserting {}", matches[0]);
                    map.insert(
                        matches[0].to_owned(),
                        LeftRight {
                            left: matches[1].to_owned(),
                            right: matches[2].to_owned(),
                        },
                    );
                });
            Walker::new(lr.to_owned(), map)
        }
        _ => {
            panic!("Problem during parsing")
        }
    }
}

pub fn solve_part_2_heavily_optimized(walker: Walker) -> usize {
    walker.walk_by_jump_map()
}
